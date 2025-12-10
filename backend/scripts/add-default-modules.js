const { getDatabase } = require('../database/init');
const path = require('path');

// Initialize database first
async function addDefaultModules() {
  try {
    // Import and initialize database
    const { initDatabase } = require('../database/init');
    await initDatabase();
    
    const db = getDatabase();
    
    if (!db) {
      console.error('Database not initialized');
      process.exit(1);
    }

    console.log('Adding default modules...');

    // Insert default modules
    db.serialize(() => {
      db.run(`
        INSERT OR IGNORE INTO modules (name, display_name, description, order_index) VALUES
        ('security-awareness', 'Security Awareness Essentials', 'Core security concepts and best practices', 1),
        ('phishing-red-flags', 'Phishing Red Flags', 'Identifying and avoiding phishing attempts', 2),
        ('business-email-compromise', 'Business Email Compromise (BEC)', 'Understanding and preventing BEC attacks', 3)
      `, function(err) {
        if (err) {
          console.error('Error inserting modules:', err);
          process.exit(1);
        } else {
          console.log('Default modules inserted successfully');
        }
      });

      // Insert default sections for Module 1
      db.run(`
        INSERT OR IGNORE INTO sections (module_id, name, display_name, description, order_index) 
        SELECT 1, 'introduction', 'Introduction to Security', 'Learn the basics of cybersecurity', 1
        WHERE EXISTS (SELECT 1 FROM modules WHERE id = 1)
      `, (err) => {
        if (err) console.error('Error inserting sections:', err);
      });

      // Check how many modules were inserted
      db.get('SELECT COUNT(*) as count FROM modules', (err, row) => {
        if (err) {
          console.error('Error counting modules:', err);
        } else {
          console.log(`Total modules in database: ${row.count}`);
          if (row.count === 0) {
            console.log('⚠️  No modules found. The INSERT OR IGNORE might have failed.');
            console.log('Try running this script again, or check database initialization.');
          }
        }
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to add modules:', error);
    process.exit(1);
  }
}

addDefaultModules();

