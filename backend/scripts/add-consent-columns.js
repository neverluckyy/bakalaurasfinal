const { getDatabase } = require('../database/init');

const db = getDatabase();

// Add consent tracking columns if they don't exist
const columns = [
  { name: 'terms_version', type: 'TEXT' },
  { name: 'privacy_version', type: 'TEXT' },
  { name: 'consent_timestamp', type: 'DATETIME' }
];

let completed = 0;
const total = columns.length;

columns.forEach((column) => {
  db.run(
    `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`,
    (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Error adding ${column.name} column:`, err);
        process.exit(1);
      } else {
        console.log(`✅ ${column.name} column added (or already exists)`);
        completed++;
        
        if (completed === total) {
          console.log('✅ All consent tracking columns added successfully');
          process.exit(0);
        }
      }
    }
  );
});

