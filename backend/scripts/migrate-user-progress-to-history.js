const { getDatabase, closeDatabase } = require('../database/init');

/**
 * Migration script to remove UNIQUE constraint from user_progress table
 * This allows tracking history of every question attempt (one-to-many relationship)
 * Run this once if you have an existing database with the UNIQUE constraint
 */

async function migrateUserProgress() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    console.log('========================================');
    console.log('User Progress Table Migration');
    console.log('========================================');
    console.log('Migrating user_progress to support attempt history...');
    console.log('');
    
    db.serialize(() => {
      // Check if UNIQUE constraint exists
      db.get(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='user_progress' AND sql LIKE '%UNIQUE(user_id, question_id)%'
      `, (err, row) => {
        if (err) {
          console.error('Error checking table structure:', err);
          return reject(err);
        }
        
        if (!row) {
          console.log('✓ Table already migrated (no UNIQUE constraint found)');
          console.log('  No migration needed.');
          return resolve();
        }
        
        console.log('Found UNIQUE constraint. Starting migration...');
        console.log('');
        
        // Step 1: Create new table without UNIQUE constraint
        console.log('Step 1: Creating new table structure...');
        db.run(`
          CREATE TABLE IF NOT EXISTS user_progress_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            is_correct BOOLEAN NOT NULL,
            selected_answer TEXT,
            xp_awarded INTEGER DEFAULT 0,
            answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (question_id) REFERENCES questions (id)
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating new table:', err);
            return reject(err);
          }
          console.log('  ✓ New table created');
          
          // Step 2: Copy all data from old table to new
          console.log('Step 2: Copying existing data...');
          db.run(`
            INSERT INTO user_progress_new 
            SELECT * FROM user_progress
          `, function(err) {
            if (err) {
              console.error('❌ Error copying data:', err);
              return reject(err);
            }
            console.log(`  ✓ Copied ${this.changes} records`);
            
            // Step 3: Create index for performance
            console.log('Step 3: Creating index...');
            db.run(`
              CREATE INDEX IF NOT EXISTS idx_user_progress_user_question 
              ON user_progress_new(user_id, question_id)
            `, (err) => {
              if (err) {
                console.warn('  ⚠️  Warning: Could not create index:', err.message);
              } else {
                console.log('  ✓ Index created');
              }
              
              // Step 4: Drop old table
              console.log('Step 4: Dropping old table...');
              db.run(`DROP TABLE user_progress`, (err) => {
                if (err) {
                  console.error('❌ Error dropping old table:', err);
                  return reject(err);
                }
                console.log('  ✓ Old table dropped');
                
                // Step 5: Rename new table
                console.log('Step 5: Renaming new table...');
                db.run(`ALTER TABLE user_progress_new RENAME TO user_progress`, (err) => {
                  if (err) {
                    console.error('❌ Error renaming table:', err);
                    return reject(err);
                  }
                  console.log('  ✓ Table renamed');
                  console.log('');
                  console.log('========================================');
                  console.log('✅ Migration completed successfully!');
                  console.log('========================================');
                  console.log('');
                  console.log('The user_progress table now supports:');
                  console.log('  - Multiple attempts per question (one-to-many)');
                  console.log('  - Complete history of every question attempt');
                  console.log('  - XP farming prevention via xp_awarded tracking');
                  console.log('');
                  resolve();
                });
              });
            });
          });
        });
      });
    });
  });
}

// Run the migration
migrateUserProgress()
  .then(() => {
    return closeDatabase();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('');
    console.error('========================================');
    console.error('❌ Migration failed:', err);
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

