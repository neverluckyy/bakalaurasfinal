const { initDatabase, getDatabase } = require('../database/init');

/**
 * Script to verify learning content in the database
 * Run this on Railway to check what content is actually stored
 */

async function verifyContent() {
  console.log('Verifying learning content in database...\n');
  
  await initDatabase();
  const db = getDatabase();
  
  // Find Module 1 Section 1
  const findSectionQuery = `
    SELECT s.id, s.display_name, m.display_name as module_name
    FROM sections s 
    JOIN modules m ON s.module_id = m.id 
    WHERE m.display_name = 'Security Awareness Essentials' 
    AND s.display_name = 'Phishing and Social Engineering'
    AND s.order_index = 1
  `;
  
  db.get(findSectionQuery, [], (err, section) => {
    if (err) {
      console.error('Error finding section:', err);
      process.exit(1);
    }
    
    if (!section) {
      console.error('Section not found!');
      process.exit(1);
    }
    
    console.log(`Found section: ${section.module_name} > ${section.display_name}`);
    console.log(`Section ID: ${section.id}\n`);
    
    // Get all learning content for this section
    const contentQuery = `
      SELECT 
        id,
        screen_title,
        read_time_min,
        order_index,
        LENGTH(content_markdown) as content_length,
        SUBSTR(content_markdown, 1, 100) as content_preview
      FROM learning_content
      WHERE section_id = ?
      ORDER BY order_index
    `;
    
    db.all(contentQuery, [section.id], (err, content) => {
      if (err) {
        console.error('Error fetching content:', err);
        process.exit(1);
      }
      
      console.log(`Total learning content items: ${content.length}\n`);
      
      if (content.length === 0) {
        console.log('⚠️  WARNING: No learning content found for this section!');
        console.log('The update script may not have run successfully.\n');
      } else {
        console.log('Learning content items:');
        console.log('='.repeat(80));
        
        content.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.screen_title}`);
          console.log(`   Order: ${item.order_index}`);
          console.log(`   Read time: ${item.read_time_min} min`);
          console.log(`   Content length: ${item.content_length} characters`);
          console.log(`   Preview: ${item.content_preview}...`);
        });
        
        // Check specifically for Introduction and Key Concepts
        const intro = content.find(c => c.screen_title === 'Introduction');
        const keyConcepts = content.find(c => c.screen_title === 'Key Concepts');
        
        console.log('\n' + '='.repeat(80));
        console.log('\nVerification:');
        console.log(`✓ Introduction: ${intro ? 'FOUND' : '❌ MISSING'}`);
        console.log(`✓ Key Concepts: ${keyConcepts ? 'FOUND' : '❌ MISSING'}`);
        
        if (intro) {
          // Get full Introduction content to check if it's updated
          db.get('SELECT content_markdown FROM learning_content WHERE id = ?', [intro.id], (err, row) => {
            if (!err && row) {
              const hasNewContent = row.content_markdown.includes('Welcome to the **Phishing and Social Engineering** section!');
              console.log(`  Introduction updated: ${hasNewContent ? '✓ YES (new content)' : '❌ NO (old content)'}`);
            }
          });
        }
        
        if (keyConcepts) {
          // Get full Key Concepts content to check if it's updated
          db.get('SELECT content_markdown FROM learning_content WHERE id = ?', [keyConcepts.id], (err, row) => {
            if (!err && row) {
              const hasNewContent = row.content_markdown.includes('Understanding social engineering tactics');
              console.log(`  Key Concepts updated: ${hasNewContent ? '✓ YES (new content)' : '❌ NO (old content)'}`);
            }
          });
        }
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('\nTo update the content, run:');
      console.log('  node scripts/update-module1-section1-embedded.js\n');
      
      process.exit(0);
    });
  });
}

verifyContent().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

