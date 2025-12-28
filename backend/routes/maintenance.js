const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

/**
 * Endpoint to manually trigger phishing examples page creation
 * POST /api/maintenance/add-phishing-examples-page
 */
router.post('/add-phishing-examples-page', async (req, res) => {
  try {
    const addPhishingExamplesPage = require('../scripts/add-phishing-examples-page');
    const result = await addPhishingExamplesPage();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error adding phishing examples page:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * Diagnostic endpoint to check current database state
 */
router.get('/check-content', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Find Module 1, Section 1
    const sectionQuery = `
      SELECT s.id, s.display_name, s.order_index, m.id as module_id, m.display_name as module_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;
    
    db.get(sectionQuery, [], (err, section) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }
      
      // Get all learning content
      db.all(
        'SELECT id, screen_title, order_index, read_time_min, LENGTH(content_markdown) as content_length FROM learning_content WHERE section_id = ? ORDER BY order_index',
        [section.id],
        (err, content) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', message: err.message });
          }
          
          // Check Introduction for references
          const intro = content.find(c => c.screen_title === 'Introduction');
          const hasReferences = intro && intro.content_markdown && (
            intro.content_markdown.includes('References:') || 
            intro.content_markdown.includes('## References') ||
            intro.content_markdown.includes('formatReferences')
          );
          
          // Count concept pages (should be 8 separate ones)
          const conceptPages = content.filter(c => 
            c.screen_title !== 'Introduction' && 
            !c.screen_title.toLowerCase().includes('example') &&
            c.order_index > (intro ? intro.order_index : 0)
          );
          
          // Check for Real-World Examples page
          const examplesPage = content.find(c => c.screen_title === 'Real-World Examples');
          
          res.json({
            section: {
              id: section.id,
              name: section.display_name,
              module: section.module_name,
              order_index: section.order_index
            },
            learningContent: {
              total: content.length,
              pages: content.map(c => ({
                id: c.id,
                title: c.screen_title,
                order_index: c.order_index,
                content_length: c.content_length,
                has_images: c.content_markdown && c.content_markdown.includes('![') ? 'yes' : 'no'
              }))
            },
            examplesPage: examplesPage ? {
              id: examplesPage.id,
              order_index: examplesPage.order_index,
              has_content: examplesPage.content_length > 0,
              has_images: examplesPage.content_markdown && examplesPage.content_markdown.includes('![') ? 'yes' : 'no'
            } : null,
            summary: {
              hasIntroduction: !!intro,
              hasReferences: hasReferences,
              conceptPageCount: conceptPages.length,
              hasExamplesPage: !!examplesPage
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * Endpoint to manually ensure phishing examples page exists
 * POST /api/maintenance/ensure-phishing-examples
 * Optionally accepts { force: true } in body to force update even if page exists
 */
router.post('/ensure-phishing-examples', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('MANUALLY TRIGGERING PHISHING EXAMPLES PAGE UPDATE');
    console.log('='.repeat(80));
    
    const { force } = req.body || {};
    if (force) {
      console.log('Force update requested - will update content even if page exists');
    }
    
    const ensurePhishingExamples = require('../scripts/ensure-phishing-examples-on-railway');
    const result = await ensurePhishingExamples();
    
    console.log('Result:', result);
    console.log('='.repeat(80));
    
    res.json({ 
      success: true, 
      result,
      message: `Phishing examples page ${result.action || 'updated'}`
    });
  } catch (error) {
    console.error('Error ensuring phishing examples:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
});

/**
 * Endpoint to force delete and recreate phishing examples page
 * POST /api/maintenance/force-update-phishing-examples
 */
router.post('/force-update-phishing-examples', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('FORCE UPDATING PHISHING EXAMPLES PAGE');
    console.log('='.repeat(80));
    
    const db = getDatabase();
    
    // Find the section
    const section = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.id, s.display_name
        FROM sections s 
        JOIN modules m ON s.module_id = m.id 
        WHERE m.display_name = 'Security Awareness Essentials' 
        AND s.display_name = 'Phishing and Social Engineering'
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    // Delete existing page
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        function(err) {
          if (err) reject(err);
          else {
            console.log(`✓ Deleted existing "Real-World Examples" page`);
            resolve();
          }
        }
      );
    });
    
    // Import and run the ensure function
    const ensurePhishingExamples = require('../scripts/ensure-phishing-examples-on-railway');
    const result = await ensurePhishingExamples();
    
    // Double-check: Query the database to verify no asterisks were inserted
    // and clean them if they exist (safety net)
    const verifyContent = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, content_markdown FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (verifyContent && verifyContent.content_markdown) {
      const hasAsterisks = verifyContent.content_markdown.includes('**');
      if (hasAsterisks) {
        console.error('⚠️  WARNING: Content still has asterisks after update!');
        console.error('Removing asterisks manually...');
        
        // Remove all ** markers (but keep the text)
        const cleanedContent = verifyContent.content_markdown
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **text** but keep text
          .replace(/\*\*/g, ''); // Remove any remaining **
        
        // Update with cleaned content
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE learning_content SET content_markdown = ? WHERE id = ?',
            [cleanedContent, verifyContent.id],
            function(err) {
              if (err) reject(err);
              else {
                console.log('✓ Removed asterisks from database content');
                resolve();
              }
            }
          );
        });
      } else {
        console.log('✅ Verified: Content has no asterisks');
      }
    }
    
    res.json({ 
      success: true, 
      result,
      message: 'Phishing examples page force updated'
    });
  } catch (error) {
    console.error('Error force updating phishing examples:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
});

/**
 * Get the actual content of the Real-World Examples page for debugging
 * GET /api/maintenance/get-examples-content
 */
router.get('/get-examples-content', (req, res) => {
  try {
    const db = getDatabase();
    
    // Find the section
    db.get(`
      SELECT s.id, s.display_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
    `, [], (err, section) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }
      
      // Get the Real-World Examples page content
      db.get(
        'SELECT id, screen_title, content_markdown FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        (err, page) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', message: err.message });
          }
          
          if (!page) {
            return res.status(404).json({ error: 'Real-World Examples page not found' });
          }
          
          // Check for asterisks
          const hasAsterisks = page.content_markdown.includes('**');
          const asteriskLines = page.content_markdown.split('\n')
            .map((line, i) => ({ lineNum: i + 1, line, hasAsterisks: line.includes('**') }))
            .filter(item => item.hasAsterisks);
          
          res.json({
            id: page.id,
            title: page.screen_title,
            has_asterisks: hasAsterisks,
            asterisk_line_count: asteriskLines.length,
            asterisk_lines: asteriskLines.slice(0, 20), // First 20 lines with asterisks
            content_preview: page.content_markdown.substring(0, 1000),
            content_length: page.content_markdown.length
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all sections with their IDs for debugging
 */
router.get('/sections', (req, res) => {
  try {
    const db = getDatabase();
    
    db.all(`
      SELECT 
        s.id,
        s.display_name,
        s.order_index,
        m.id as module_id,
        m.display_name as module_name,
        (SELECT COUNT(*) FROM learning_content WHERE section_id = s.id) as content_count
      FROM sections s
      JOIN modules m ON s.module_id = m.id
      ORDER BY m.id, s.order_index
    `, [], (err, sections) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      res.json({ sections });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
