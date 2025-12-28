const { getDatabase, closeDatabase } = require('../database/init');

// Get IDs from command line arguments
const args = process.argv.slice(2);
const moduleId = args.find(arg => arg.startsWith('--module='))?.split('=')[1];
const sectionId = args.find(arg => arg.startsWith('--section='))?.split('=')[1];

if (!moduleId && !sectionId) {
  console.log('Usage: node delete-module-section-by-id.js --module=<id> [--section=<id>]');
  console.log('Example: node delete-module-section-by-id.js --module=5 --section=10');
  console.log('Or: node delete-module-section-by-id.js --section=10');
  process.exit(1);
}

async function deleteSection(db, sectionId) {
  return new Promise((resolve, reject) => {
    // First, get section info
    db.get('SELECT id, name, display_name, module_id FROM sections WHERE id = ?', [sectionId], (err, section) => {
      if (err) {
        return reject(err);
      }
      
      if (!section) {
        console.log(`❌ Section with ID ${sectionId} not found`);
        return resolve();
      }
      
      console.log(`Found section: ID=${section.id}, Name=${section.name}, Display=${section.display_name}`);
      console.log(`Deleting section ID: ${sectionId} and all related data...`);
      
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
            return reject(err);
          }
          
          if (this.changes > 0) {
            console.log(`  ✅ Successfully deleted section (ID: ${sectionId})`);
          } else {
            console.log(`  ⚠️  Section was not deleted (no changes)`);
          }
          
          resolve();
        });
      });
    });
  });
}

async function deleteModule(db, moduleId) {
  return new Promise((resolve, reject) => {
    // First, get module info and check for sections
    db.get('SELECT id, name, display_name FROM modules WHERE id = ?', [moduleId], (err, module) => {
      if (err) {
        return reject(err);
      }
      
      if (!module) {
        console.log(`❌ Module with ID ${moduleId} not found`);
        return resolve();
      }
      
      console.log(`Found module: ID=${module.id}, Name=${module.name}, Display=${module.display_name}`);
      
      // Check for sections
      db.get('SELECT COUNT(*) as count FROM sections WHERE module_id = ?', [moduleId], (err, result) => {
        if (err) {
          return reject(err);
        }
        
        if (result.count > 0) {
          console.log(`⚠️  Module has ${result.count} section(s). Deleting sections first...`);
          
          // Get all sections in this module
          db.all('SELECT id FROM sections WHERE module_id = ?', [moduleId], async (err, sections) => {
            if (err) {
              return reject(err);
            }
            
            // Delete each section
            for (const section of sections) {
              await deleteSection(db, section.id);
            }
            
            // Now delete the module
            db.run('DELETE FROM modules WHERE id = ?', [moduleId], function(err) {
              if (err) {
                console.error(`  ❌ Error deleting module:`, err);
                return reject(err);
              }
              
              if (this.changes > 0) {
                console.log(`  ✅ Successfully deleted module (ID: ${moduleId})`);
              } else {
                console.log(`  ⚠️  Module was not deleted (no changes)`);
              }
              
              resolve();
            });
          });
        } else {
          // No sections, just delete the module
          console.log(`Deleting module ID: ${moduleId}...`);
          db.run('DELETE FROM modules WHERE id = ?', [moduleId], function(err) {
            if (err) {
              console.error(`  ❌ Error deleting module:`, err);
              return reject(err);
            }
            
            if (this.changes > 0) {
              console.log(`  ✅ Successfully deleted module (ID: ${moduleId})`);
            } else {
              console.log(`  ⚠️  Module was not deleted (no changes)`);
            }
            
            resolve();
          });
        }
      });
    });
  });
}

async function main() {
  const db = getDatabase();
  
  console.log('========================================');
  console.log('Delete Module/Section by ID');
  console.log('========================================');
  console.log('');
  
  try {
    if (sectionId) {
      await deleteSection(db, sectionId);
    }
    
    if (moduleId) {
      await deleteModule(db, moduleId);
    }
    
    console.log('');
    console.log('========================================');
    console.log('✅ Script completed successfully');
    console.log('========================================');
  } catch (err) {
    console.error('');
    console.error('========================================');
    console.error('❌ Script failed:', err);
    console.error('========================================');
    throw err;
  } finally {
    await closeDatabase();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });

