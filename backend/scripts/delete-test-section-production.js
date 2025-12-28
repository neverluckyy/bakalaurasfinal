const { getDatabase, closeDatabase } = require('../database/init');

async function deleteTestSectionProduction() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // First, find test sections (case-insensitive)
    db.all(
      `SELECT id, name, display_name, module_id 
       FROM sections 
       WHERE LOWER(name) LIKE '%test%' 
          OR LOWER(display_name) LIKE '%test%'
       ORDER BY id`,
      [],
      (err, sections) => {
        if (err) {
          console.error('Error finding test sections:', err);
          return reject(err);
        }
        
        if (!sections || sections.length === 0) {
          console.log('✅ No test sections found in database');
          return resolve();
        }
        
        console.log(`Found ${sections.length} test section(s):`);
        sections.forEach(s => {
          console.log(`  - Section ID: ${s.id}, Name: ${s.name}, Display: ${s.display_name}, Module ID: ${s.module_id}`);
        });
        console.log('');
        
        // Delete each test section
        let processed = 0;
        sections.forEach((section) => {
          const sectionId = section.id;
          console.log(`Deleting section ID: ${sectionId}...`);
          
          // Delete all related records
          db.serialize(() => {
            // Delete user progress for questions in this section
            db.run(
              `DELETE FROM user_progress 
               WHERE question_id IN (SELECT id FROM questions WHERE section_id = ?)`,
              [sectionId],
              (err) => {
                if (err) {
                  console.error(`  ❌ Error deleting user progress:`, err);
                } else {
                  console.log(`  ✓ Deleted user progress records`);
                }
              }
            );
            
            // Delete user learning progress for content in this section
            db.run(
              `DELETE FROM user_learning_progress 
               WHERE learning_content_id IN (SELECT id FROM learning_content WHERE section_id = ?)`,
              [sectionId],
              (err) => {
                if (err) {
                  console.error(`  ❌ Error deleting user learning progress:`, err);
                } else {
                  console.log(`  ✓ Deleted user learning progress records`);
                }
              }
            );
            
            // Delete questions
            db.run('DELETE FROM questions WHERE section_id = ?', [sectionId], (err) => {
              if (err) {
                console.error(`  ❌ Error deleting questions:`, err);
              } else {
                console.log(`  ✓ Deleted questions`);
              }
            });
            
            // Delete learning content
            db.run('DELETE FROM learning_content WHERE section_id = ?', [sectionId], (err) => {
              if (err) {
                console.error(`  ❌ Error deleting learning content:`, err);
              } else {
                console.log(`  ✓ Deleted learning content`);
              }
            });
            
            // Delete section reading positions
            db.run('DELETE FROM section_reading_position WHERE section_id = ?', [sectionId], (err) => {
              if (err) {
                console.error(`  ❌ Error deleting section reading positions:`, err);
              } else {
                console.log(`  ✓ Deleted section reading positions`);
              }
            });
            
            // Delete quiz draft states
            db.run('DELETE FROM quiz_draft_state WHERE section_id = ?', [sectionId], (err) => {
              if (err) {
                console.error(`  ❌ Error deleting quiz draft states:`, err);
              } else {
                console.log(`  ✓ Deleted quiz draft states`);
              }
            });
            
            // Finally, delete the section itself
            db.run('DELETE FROM sections WHERE id = ?', [sectionId], function(err) {
              if (err) {
                console.error(`  ❌ Error deleting section:`, err);
                processed++;
                if (processed === sections.length) {
                  resolve();
                }
              } else {
                if (this.changes > 0) {
                  console.log(`  ✅ Successfully deleted test section (ID: ${sectionId})`);
                } else {
                  console.log(`  ⚠️  Section ${sectionId} was not deleted (no changes)`);
                }
                processed++;
                if (processed === sections.length) {
                  resolve();
                }
              }
            });
          });
        });
      }
    );
  });
}

// Run the script
console.log('========================================');
console.log('Delete Test Section from Production');
console.log('========================================');
console.log('');

deleteTestSectionProduction()
  .then(() => {
    console.log('');
    console.log('========================================');
    console.log('✅ Script completed successfully');
    console.log('========================================');
    return closeDatabase();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('');
    console.error('========================================');
    console.error('❌ Script failed:', err);
    console.error('========================================');
    return closeDatabase();
  })
  .then(() => {
    process.exit(1);
  })
  .catch((closeErr) => {
    console.error('Error closing database:', closeErr);
    process.exit(1);
  });

