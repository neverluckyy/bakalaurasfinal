const { getDatabase, closeDatabase } = require('../database/init');

async function deleteTestSection() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // First, find the test section
    db.get('SELECT id FROM sections WHERE name = ? OR display_name = ?', ['test', 'test'], (err, section) => {
      if (err) {
        console.error('Error finding test section:', err);
        return reject(err);
      }
      
      if (!section) {
        console.log('Test section not found in database');
        return resolve();
      }
      
      const sectionId = section.id;
      console.log(`Found test section with ID: ${sectionId}`);
      
      // Delete all related records
      db.serialize(() => {
        // Delete user progress for questions in this section
        db.run(`
          DELETE FROM user_progress 
          WHERE question_id IN (SELECT id FROM questions WHERE section_id = ?)
        `, [sectionId], (err) => {
          if (err) {
            console.error('Error deleting user progress:', err);
          } else {
            console.log('Deleted user progress records');
          }
        });
        
        // Delete user learning progress for content in this section
        db.run(`
          DELETE FROM user_learning_progress 
          WHERE learning_content_id IN (SELECT id FROM learning_content WHERE section_id = ?)
        `, [sectionId], (err) => {
          if (err) {
            console.error('Error deleting user learning progress:', err);
          } else {
            console.log('Deleted user learning progress records');
          }
        });
        
        // Delete questions
        db.run('DELETE FROM questions WHERE section_id = ?', [sectionId], (err) => {
          if (err) {
            console.error('Error deleting questions:', err);
          } else {
            console.log('Deleted questions');
          }
        });
        
        // Delete learning content
        db.run('DELETE FROM learning_content WHERE section_id = ?', [sectionId], (err) => {
          if (err) {
            console.error('Error deleting learning content:', err);
          } else {
            console.log('Deleted learning content');
          }
        });
        
        // Delete section reading positions
        db.run('DELETE FROM section_reading_position WHERE section_id = ?', [sectionId], (err) => {
          if (err) {
            console.error('Error deleting section reading positions:', err);
          } else {
            console.log('Deleted section reading positions');
          }
        });
        
        // Delete quiz draft states
        db.run('DELETE FROM quiz_draft_state WHERE section_id = ?', [sectionId], (err) => {
          if (err) {
            console.error('Error deleting quiz draft states:', err);
          } else {
            console.log('Deleted quiz draft states');
          }
        });
        
        // Finally, delete the section itself
        db.run('DELETE FROM sections WHERE id = ?', [sectionId], function(err) {
          if (err) {
            console.error('Error deleting section:', err);
            return reject(err);
          }
          
          if (this.changes === 0) {
            console.log('Section was not deleted (no changes)');
          } else {
            console.log(`Successfully deleted test section (ID: ${sectionId})`);
          }
          
          resolve();
        });
      });
    });
  });
}

// Run the script
deleteTestSection()
  .then(() => {
    console.log('Script completed successfully');
    closeDatabase()
      .then(() => {
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing database:', err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error('Script failed:', err);
    closeDatabase()
      .then(() => {
        process.exit(1);
      })
      .catch((closeErr) => {
        console.error('Error closing database:', closeErr);
        process.exit(1);
      });
  });

