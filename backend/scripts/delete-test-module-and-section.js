const { getDatabase, closeDatabase } = require('../database/init');

async function deleteTestModuleAndSection() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // First, find test modules (case-insensitive search)
    db.all(
      `SELECT id, name, display_name 
       FROM modules 
       WHERE LOWER(name) LIKE '%test%' 
          OR LOWER(display_name) LIKE '%test%'`,
      [],
      (err, modules) => {
        if (err) {
          console.error('Error finding test modules:', err);
          return reject(err);
        }
        
        if (!modules || modules.length === 0) {
          console.log('No test modules found in database');
          // Still check for orphaned test sections
          deleteTestSections(db, null)
            .then(() => resolve())
            .catch(reject);
          return;
        }
        
        console.log(`Found ${modules.length} test module(s):`);
        modules.forEach(m => {
          console.log(`  - Module ID: ${m.id}, Name: ${m.name}, Display: ${m.display_name}`);
        });
        
        // Process each test module
        let processed = 0;
        modules.forEach((module) => {
          deleteTestSections(db, module.id)
            .then(() => {
              // After deleting sections, delete the module
              db.run('DELETE FROM modules WHERE id = ?', [module.id], function(err) {
                if (err) {
                  console.error(`Error deleting module ${module.id}:`, err);
                } else {
                  if (this.changes > 0) {
                    console.log(`✅ Successfully deleted test module (ID: ${module.id}, Name: ${module.name})`);
                  } else {
                    console.log(`⚠️  Module ${module.id} was not deleted (no changes)`);
                  }
                }
                
                processed++;
                if (processed === modules.length) {
                  // Also check for orphaned test sections (not in any module or in deleted modules)
                  deleteTestSections(db, null)
                    .then(() => resolve())
                    .catch(reject);
                }
              });
            })
            .catch((sectionErr) => {
              console.error(`Error deleting sections for module ${module.id}:`, sectionErr);
              processed++;
              if (processed === modules.length) {
                resolve(); // Continue even if some sections failed
              }
            });
        });
      }
    );
  });
}

async function deleteTestSections(db, moduleId) {
  return new Promise((resolve, reject) => {
    // Find test sections
    let query, params;
    if (moduleId) {
      query = `SELECT id FROM sections 
               WHERE module_id = ? 
                 AND (LOWER(name) LIKE '%test%' OR LOWER(display_name) LIKE '%test%')`;
      params = [moduleId];
    } else {
      // Find orphaned test sections (not in any module or in non-existent modules)
      query = `SELECT s.id 
               FROM sections s
               LEFT JOIN modules m ON s.module_id = m.id
               WHERE (LOWER(s.name) LIKE '%test%' OR LOWER(s.display_name) LIKE '%test%')
                 AND (m.id IS NULL OR LOWER(m.name) LIKE '%test%' OR LOWER(m.display_name) LIKE '%test%')`;
      params = [];
    }
    
    db.all(query, params, (err, sections) => {
      if (err) {
        console.error('Error finding test sections:', err);
        return reject(err);
      }
      
      if (!sections || sections.length === 0) {
        if (moduleId) {
          console.log(`No test sections found for module ${moduleId}`);
        } else {
          console.log('No orphaned test sections found');
        }
        return resolve();
      }
      
      console.log(`Found ${sections.length} test section(s) to delete`);
      
      // Process each section
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
                console.error(`  Error deleting user progress for section ${sectionId}:`, err);
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
                console.error(`  Error deleting user learning progress for section ${sectionId}:`, err);
              } else {
                console.log(`  ✓ Deleted user learning progress records`);
              }
            }
          );
          
          // Delete questions
          db.run('DELETE FROM questions WHERE section_id = ?', [sectionId], (err) => {
            if (err) {
              console.error(`  Error deleting questions for section ${sectionId}:`, err);
            } else {
              console.log(`  ✓ Deleted questions`);
            }
          });
          
          // Delete learning content
          db.run('DELETE FROM learning_content WHERE section_id = ?', [sectionId], (err) => {
            if (err) {
              console.error(`  Error deleting learning content for section ${sectionId}:`, err);
            } else {
              console.log(`  ✓ Deleted learning content`);
            }
          });
          
          // Delete section reading positions
          db.run('DELETE FROM section_reading_position WHERE section_id = ?', [sectionId], (err) => {
            if (err) {
              console.error(`  Error deleting section reading positions for section ${sectionId}:`, err);
            } else {
              console.log(`  ✓ Deleted section reading positions`);
            }
          });
          
          // Delete quiz draft states
          db.run('DELETE FROM quiz_draft_state WHERE section_id = ?', [sectionId], (err) => {
            if (err) {
              console.error(`  Error deleting quiz draft states for section ${sectionId}:`, err);
            } else {
              console.log(`  ✓ Deleted quiz draft states`);
            }
          });
          
          // Finally, delete the section itself
          db.run('DELETE FROM sections WHERE id = ?', [sectionId], function(err) {
            if (err) {
              console.error(`  ❌ Error deleting section ${sectionId}:`, err);
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
    });
  });
}

// Run the script
console.log('========================================');
console.log('Delete Test Module and Section Script');
console.log('========================================');
console.log('');

deleteTestModuleAndSection()
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

