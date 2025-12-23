const { initDatabase, getDatabase } = require('../database/init');

/**
 * Comprehensive diagnostic script to identify why learning content isn't updating
 * Run this on Railway and share the output
 */

async function diagnose() {
  console.log('='.repeat(80));
  console.log('LEARNING CONTENT DIAGNOSTIC TOOL');
  console.log('='.repeat(80));
  console.log('');
  
  await initDatabase();
  const db = getDatabase();
  
  // 1. Find the section
  console.log('1. Finding Section...');
  const findSectionQuery = `
    SELECT s.id, s.display_name, s.order_index, m.display_name as module_name, m.id as module_id
    FROM sections s 
    JOIN modules m ON s.module_id = m.id 
    WHERE m.display_name = 'Security Awareness Essentials' 
    AND s.display_name = 'Phishing and Social Engineering'
    AND s.order_index = 1
  `;
  
  db.get(findSectionQuery, [], (err, section) => {
    if (err) {
      console.error('❌ Error finding section:', err);
      process.exit(1);
    }
    
    if (!section) {
      console.error('❌ Section not found!');
      console.log('Available sections:');
      db.all('SELECT s.id, s.display_name, m.display_name as module FROM sections s JOIN modules m ON s.module_id = m.id', [], (err, allSections) => {
        if (!err) {
          allSections.forEach(s => console.log(`  - ${s.module} > ${s.display_name} (ID: ${s.id})`));
        }
        process.exit(1);
      });
      return;
    }
    
    console.log(`✓ Found section: ${section.module_name} > ${section.display_name}`);
    console.log(`  Section ID: ${section.id}`);
    console.log(`  Module ID: ${section.module_id}`);
    console.log('');
    
    // 2. Check all learning content for this section
    console.log('2. Checking Learning Content...');
    db.all('SELECT id, screen_title, order_index, read_time_min, LENGTH(content_markdown) as content_length, SUBSTR(content_markdown, 1, 150) as preview FROM learning_content WHERE section_id = ? ORDER BY order_index', 
      [section.id], 
      (err, content) => {
        if (err) {
          console.error('❌ Error fetching content:', err);
          process.exit(1);
        }
        
        console.log(`Found ${content.length} learning content items:`);
        console.log('');
        
        if (content.length === 0) {
          console.log('⚠️  WARNING: No learning content found!');
          console.log('The section exists but has no content.');
        } else {
          content.forEach((item, index) => {
            console.log(`${index + 1}. ${item.screen_title}`);
            console.log(`   Order: ${item.order_index}`);
            console.log(`   Read time: ${item.read_time_min} min`);
            console.log(`   Content length: ${item.content_length} characters`);
            console.log(`   Preview: ${item.preview}...`);
            console.log('');
          });
        }
        
        // 3. Check specifically for Introduction and Key Concepts
        console.log('3. Checking Introduction and Key Concepts...');
        const intro = content.find(c => c.screen_title === 'Introduction');
        const keyConcepts = content.find(c => c.screen_title === 'Key Concepts');
        
        console.log(`Introduction: ${intro ? '✓ FOUND' : '❌ MISSING'}`);
        if (intro) {
          console.log(`  - Order: ${intro.order_index}`);
          console.log(`  - Length: ${intro.content_length} chars`);
          
          // Check if it's the new version
          db.get('SELECT content_markdown FROM learning_content WHERE id = ?', [intro.id], (err, row) => {
            if (!err && row) {
              const isNew = row.content_markdown.includes('Welcome to the **Phishing and Social Engineering** section!');
              console.log(`  - Is new version: ${isNew ? '✓ YES' : '❌ NO (old version)'}`);
            }
          });
        }
        
        console.log(`Key Concepts: ${keyConcepts ? '✓ FOUND' : '❌ MISSING'}`);
        if (keyConcepts) {
          console.log(`  - Order: ${keyConcepts.order_index}`);
          console.log(`  - Length: ${keyConcepts.content_length} chars`);
          
          // Check if it's the new version
          db.get('SELECT content_markdown FROM learning_content WHERE id = ?', [keyConcepts.id], (err, row) => {
            if (!err && row) {
              const hasNewContent = row.content_markdown.includes('Understanding social engineering tactics') && 
                                   row.content_markdown.includes('Types of Social Engineering Attacks') &&
                                   row.content_markdown.includes('Phishing (email): "the inbox trap"');
              const isDetailed = row.content_length > 2000; // New content should be much longer
              console.log(`  - Has new content: ${hasNewContent ? '✓ YES' : '❌ NO'}`);
              console.log(`  - Is detailed (length > 2000): ${isDetailed ? '✓ YES' : '❌ NO (too short)'}`);
              
              if (!hasNewContent || !isDetailed) {
                console.log('');
                console.log('⚠️  PROBLEM DETECTED: Key Concepts has old content!');
                console.log('   Expected: Detailed paragraphs about each attack type');
                console.log('   Actual: Short bullet points or old format');
                console.log('');
                console.log('SOLUTION: Run the force-update script:');
                console.log('   node scripts/force-update-learning-content.js');
              }
            }
          });
        }
        
        console.log('');
        
        // 4. Check database file location
        console.log('4. Database Information...');
        const dbPath = require('path').join(__dirname, '../database/learning_app.db');
        const fs = require('fs');
        if (fs.existsSync(dbPath)) {
          const stats = fs.statSync(dbPath);
          console.log(`✓ Database file exists: ${dbPath}`);
          console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
          console.log(`  Modified: ${stats.mtime.toISOString()}`);
        } else {
          console.log(`❌ Database file not found at: ${dbPath}`);
        }
        
        console.log('');
        console.log('='.repeat(80));
        console.log('DIAGNOSTIC COMPLETE');
        console.log('='.repeat(80));
        console.log('');
        console.log('Next steps:');
        if (!intro || !keyConcepts) {
          console.log('1. Run: node scripts/force-update-learning-content.js');
        } else if (keyConcepts.content_length < 2000) {
          console.log('1. Content exists but is OLD VERSION');
          console.log('2. Run: node scripts/force-update-learning-content.js');
        } else {
          console.log('1. Content appears to be updated correctly');
          console.log('2. If website still shows old content:');
          console.log('   - Clear browser cache (Ctrl+Shift+R)');
          console.log('   - Check browser DevTools → Network tab');
          console.log('   - Verify API response has new content');
        }
        console.log('');
        
        process.exit(0);
      }
    );
  });
}

diagnose().catch(err => {
  console.error('Diagnostic failed:', err);
  process.exit(1);
});

