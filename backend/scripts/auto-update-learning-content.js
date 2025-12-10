const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { initDatabase, getDatabase } = require('../database/init');

/**
 * Auto-update script that can be run on server startup.
 * Reads the authoritative learning_content.csv and refreshes
 * Module 1 / Section 1 (Phishing and Social Engineering)
 * so each topic stays on its own page with references.
 */

// Try multiple possible paths for the CSV file
const possiblePaths = [
  path.join(__dirname, '../learning_content.csv'), // From backend/scripts -> backend/learning_content.csv
  path.join(__dirname, '../../learning_content.csv'), // From backend/scripts -> root/learning_content.csv
  path.join(process.cwd(), 'learning_content.csv'), // From current working directory
  path.join(process.cwd(), '../learning_content.csv'), // One level up from working directory
  '/app/learning_content.csv', // Absolute path in container
];

// Find the first path that exists
let CSV_PATH = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    CSV_PATH = possiblePath;
    break;
  }
}

// If not found, use the first path as default (will error with helpful message)
if (!CSV_PATH) {
  CSV_PATH = possiblePaths[0];
}
const TARGET_MODULE = 'Security Awareness Essentials';
const TARGET_SECTION = 'Phishing and Social Engineering';

const runAsync = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const allAsync = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const getAsync = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

async function loadSectionContentFromCsv() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_PATH)) {
      const checkedPaths = possiblePaths.join(', ');
      reject(new Error(`Learning content CSV not found. Checked paths: ${checkedPaths}. Current: ${CSV_PATH}. __dirname: ${__dirname}, cwd: ${process.cwd()}`));
      return;
    }

    const rows = [];
    fs.createReadStream(CSV_PATH, { encoding: 'utf8' })
      .pipe(csv({
        skipLinesWithError: true,
        skipEmptyLines: true
      }))
      .on('data', (row) => {
        // Clean up any BOM or encoding issues from keys
        const cleanedRow = {};
        for (const key in row) {
          // Remove BOM and null bytes, trim whitespace
          let cleanKey = key.replace(/^\uFEFF/, '').replace(/^[^\x20-\x7E]+/, '').trim();
          // Normalize common column name variations
          if (cleanKey.toLowerCase().includes('module') && !cleanKey.toLowerCase().startsWith('module')) {
            cleanKey = 'module';
          }
          const cleanValue = typeof row[key] === 'string' 
            ? row[key].replace(/^\uFEFF/, '').replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '').replace(/\0/g, '').trim() 
            : row[key];
          cleanedRow[cleanKey] = cleanValue;
        }
        
        if (cleanedRow.module === TARGET_MODULE && cleanedRow.section === TARGET_SECTION) {
          rows.push({
            screen_title: cleanedRow.screen_title,
            read_time_min: parseInt(cleanedRow.read_time_min, 10) || 2,
            content_markdown: cleanedRow.content_markdown || ''
          });
        }
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function needsUpdate(db, sectionId, expectedContent) {
  const existing = await allAsync(
    db,
    'SELECT screen_title, content_markdown FROM learning_content WHERE section_id = ? ORDER BY order_index',
    [sectionId]
  );

  const expectedTitles = expectedContent.map(item => item.screen_title);
  const dbTitles = existing.map(item => item.screen_title);

  const missing = expectedTitles.filter(title => !dbTitles.includes(title));
  const extra = dbTitles.filter(title => !expectedTitles.includes(title));
  const hasKeyConcepts = dbTitles.includes('Key Concepts');
  const lengthMismatch = existing.length !== expectedContent.length;
  const contentChanged = existing.some((row, index) => {
    const expected = expectedContent[index];
    if (!expected) return true;
    if (expected.screen_title !== row.screen_title) return true;
    return (expected.content_markdown || '').trim() !== (row.content_markdown || '').trim();
  });

  const needsUpdate =
    missing.length > 0 ||
    extra.length > 0 ||
    hasKeyConcepts ||
    lengthMismatch ||
    contentChanged;

  if (needsUpdate) {
    console.log(
      `[Auto-Update] Update needed. missing=[${missing.join(', ') || 'none'}], extra=[${extra.join(', ') || 'none'}], hasKeyConcepts=${hasKeyConcepts}, lengthMismatch=${lengthMismatch}, contentChanged=${contentChanged}`
    );
  }

  return needsUpdate;
}

async function autoUpdate() {
  try {
    await initDatabase();
    const db = getDatabase();

    const section = await getAsync(
      db,
      `SELECT s.id 
       FROM sections s 
       JOIN modules m ON s.module_id = m.id 
       WHERE m.display_name = ? 
         AND s.display_name = ? 
         AND s.order_index = 1`,
      [TARGET_MODULE, TARGET_SECTION]
    );

    if (!section) {
      console.log('[Auto-Update] Section not found, skipping update');
      return false;
    }

    const expectedContent = await loadSectionContentFromCsv();
    if (expectedContent.length === 0) {
      console.log('[Auto-Update] No CSV rows found for target section; skipping');
      return false;
    }

    const updateNeeded = await needsUpdate(db, section.id, expectedContent);
    if (!updateNeeded) {
      console.log('[Auto-Update] Content is already up to date, skipping update');
      return false;
    }

    console.log('[Auto-Update] Refreshing content from CSV...');

    const existingContent = await allAsync(
      db,
      'SELECT id FROM learning_content WHERE section_id = ?',
      [section.id]
    );
    const contentIds = existingContent.map(c => c.id);

    if (contentIds.length > 0) {
      await runAsync(
        db,
        `DELETE FROM user_learning_progress WHERE learning_content_id IN (${contentIds.map(() => '?').join(',')})`,
        contentIds
      ).catch(err => console.warn('[Auto-Update] Warning: could not clear user progress:', err));
    }

    await runAsync(db, 'DELETE FROM learning_content WHERE section_id = ?', [section.id]);

    let orderIndex = 1;
    for (const entry of expectedContent) {
      await runAsync(
        db,
        'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
        [section.id, entry.screen_title, entry.read_time_min, entry.content_markdown, orderIndex]
      );
      console.log(`[Auto-Update] Inserted #${orderIndex}: ${entry.screen_title}`);
      orderIndex += 1;
    }

    console.log(`[Auto-Update] Learning content refreshed (${expectedContent.length} pages inserted)`);
    return true;
  } catch (error) {
    console.error('[Auto-Update] Fatal error:', error);
    throw error;
  }
}

module.exports = { autoUpdate };
