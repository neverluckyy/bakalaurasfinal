const { getDatabase, closeDatabase } = require('../database/init');

async function listModulesAndSections() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Get all modules with their sections
    db.all(
      `SELECT 
        m.id as module_id,
        m.name as module_name,
        m.display_name as module_display_name,
        m.order_index as module_order,
        s.id as section_id,
        s.name as section_name,
        s.display_name as section_display_name,
        s.order_index as section_order
      FROM modules m
      LEFT JOIN sections s ON m.id = s.module_id
      ORDER BY m.order_index, s.order_index`,
      [],
      (err, rows) => {
        if (err) {
          return reject(err);
        }
        
        console.log('========================================');
        console.log('Modules and Sections List');
        console.log('========================================');
        console.log('');
        
        if (!rows || rows.length === 0) {
          console.log('No modules found in database');
          return resolve();
        }
        
        // Group by module
        const modulesMap = new Map();
        
        rows.forEach(row => {
          if (!modulesMap.has(row.module_id)) {
            modulesMap.set(row.module_id, {
              id: row.module_id,
              name: row.module_name,
              display_name: row.module_display_name,
              order: row.module_order,
              sections: []
            });
          }
          
          if (row.section_id) {
            modulesMap.get(row.module_id).sections.push({
              id: row.section_id,
              name: row.section_name,
              display_name: row.section_display_name,
              order: row.section_order
            });
          }
        });
        
        // Display modules and sections
        modulesMap.forEach((module, moduleId) => {
          console.log(`Module ID: ${module.id}`);
          console.log(`  Name: ${module.name}`);
          console.log(`  Display Name: ${module.display_name}`);
          console.log(`  Order: ${module.order}`);
          console.log(`  Sections: ${module.sections.length}`);
          
          if (module.sections.length > 0) {
            module.sections.forEach(section => {
              console.log(`    - Section ID: ${section.id}`);
              console.log(`      Name: ${section.name}`);
              console.log(`      Display Name: ${section.display_name}`);
              console.log(`      Order: ${section.order}`);
            });
          } else {
            console.log(`    (No sections)`);
          }
          console.log('');
        });
        
        console.log('========================================');
        console.log('To delete a module:');
        console.log('  node scripts/delete-module-section-by-id.js --module=<id>');
        console.log('');
        console.log('To delete a section:');
        console.log('  node scripts/delete-module-section-by-id.js --section=<id>');
        console.log('');
        console.log('To delete both:');
        console.log('  node scripts/delete-module-section-by-id.js --module=<id> --section=<id>');
        console.log('========================================');
        
        resolve();
      }
    );
  });
}

// Run the script
listModulesAndSections()
  .then(() => {
    return closeDatabase();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    closeDatabase()
      .then(() => {
        process.exit(1);
      })
      .catch((closeErr) => {
        console.error('Error closing database:', closeErr);
        process.exit(1);
      });
  });

