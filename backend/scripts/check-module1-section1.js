const { initDatabase, getDatabase } = require('../database/init');

/**
 * Quick check script to verify Module 1 Section 1 has learning content
 * This will help diagnose why content is not appearing
 */

async function checkContent() {
  console.log('='.repeat(80));
  console.log('MODULE 1 SECTION 1 CONTENT CHECK');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    await initDatabase();
    const db = getDatabase();
    
    // Step 1: Find the section
    console.log('Step 1: Finding Module 1 Section 1...');
    const findSectionQuery = `
      SELECT s.id, s.display_name, s.name, s.order_index, 
             m.id as module_id, m.display_name as module_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;
    
    const section = await new Promise((resolve, reject) => {
      db.get(findSectionQuery, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!section) {
      console.error('❌ Section not found!');
      console.log('\nListing all sections:');
      const allSections = await new Promise((resolve, reject) => {
        db.all('SELECT s.id, s.display_name, s.order_index, m.display_name as module_name FROM sections s JOIN modules m ON s.module_id = m.id ORDER BY m.order_index, s.order_index', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      allSections.forEach(s => {
        console.log(`  Module: ${s.module_name} | Section: ${s.display_name} (ID: ${s.id}, order: ${s.order_index})`);
      });
      process.exit(1);
    }
    
    console.log(`✓ Found section: ${section.module_name} > ${section.display_name}`);
    console.log(`  Section ID: ${section.id}`);
    console.log(`  Section Name: ${section.name}`);
    console.log(`  Module ID: ${section.module_id}`);
    console.log('');
    
    // Step 2: Check learning content
    console.log('Step 2: Checking learning content...');
    const content = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, screen_title, order_index, read_time_min, 
               LENGTH(content_markdown) as content_length,
               SUBSTR(content_markdown, 1, 100) as preview
        FROM learning_content
        WHERE section_id = ?
        ORDER BY order_index
      `, [section.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log(`Found ${content.length} learning content item(s)\n`);
    
    if (content.length === 0) {
      console.log('❌ PROBLEM: No learning content found!');
      console.log('');
      console.log('SOLUTION:');
      console.log('  1. Run the update script:');
      console.log('     node scripts/update-module1-section1-embedded.js');
      console.log('');
      console.log('  2. If running on Railway, connect via Railway Shell and run:');
      console.log('     cd backend && node scripts/update-module1-section1-embedded.js');
      process.exit(1);
    }
    
    // Display all content items
    console.log('Learning content items:');
    console.log('-'.repeat(80));
    content.forEach((item, index) => {
      console.log(`${index + 1}. ${item.screen_title}`);
      console.log(`   Order: ${item.order_index} | Read time: ${item.read_time_min} min`);
      console.log(`   Content length: ${item.content_length} characters`);
      console.log(`   Preview: ${item.preview}...`);
      console.log('');
    });
    
    // Step 3: Check if Introduction and Key Concepts exist and are updated
    console.log('Step 3: Verifying Introduction and Key Concepts...');
    const intro = content.find(c => c.screen_title === 'Introduction');
    const keyConcepts = content.find(c => c.screen_title === 'Key Concepts');
    
    let introUpdated = false;
    let keyConceptsUpdated = false;
    
    if (intro) {
      const fullIntro = await new Promise((resolve, reject) => {
        db.get('SELECT content_markdown FROM learning_content WHERE id = ?', [intro.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      introUpdated = fullIntro?.content_markdown?.includes('Welcome to the **Phishing and Social Engineering** section!') || false;
    }
    
    if (keyConcepts) {
      const fullKeyConcepts = await new Promise((resolve, reject) => {
        db.get('SELECT content_markdown FROM learning_content WHERE id = ?', [keyConcepts.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      keyConceptsUpdated = fullKeyConcepts?.content_markdown?.includes('Understanding social engineering tactics') || false;
    }
    
    console.log(`Introduction: ${intro ? '✓ EXISTS' : '❌ MISSING'}`);
    if (intro) {
      console.log(`  - Updated: ${introUpdated ? '✓ YES (new content)' : '❌ NO (old content)'}`);
    }
    
    console.log(`Key Concepts: ${keyConcepts ? '✓ EXISTS' : '❌ MISSING'}`);
    if (keyConcepts) {
      console.log(`  - Updated: ${keyConceptsUpdated ? '✓ YES (new content)' : '❌ NO (old content)'}`);
    }
    console.log('');
    
    // Step 4: Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    
    if (content.length === 0) {
      console.log('❌ No learning content found. Update script needs to be run.');
    } else if (!intro || !keyConcepts) {
      console.log('⚠️  Introduction or Key Concepts missing. Update script needs to be run.');
    } else if (!introUpdated || !keyConceptsUpdated) {
      console.log('⚠️  Content exists but is outdated. Update script needs to be run.');
    } else {
      console.log('✓ Learning content appears to be correctly updated!');
      console.log('');
      console.log('If content still doesn\'t appear on the website:');
      console.log('  1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('  2. Check browser DevTools → Network tab for API errors');
      console.log('  3. Verify the API endpoint: /api/learning-content/section/' + section.id);
      console.log('  4. Check Railway logs for any errors');
    }
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

checkContent();

