const { initDatabase, getDatabase } = require('../database/init');

/**
 * Remove references section from Introduction page only
 * This script updates the Introduction content to remove the References section
 */

async function removeIntroReferences() {
  console.log('='.repeat(80));
  console.log('Removing References from Introduction page...');
  console.log('='.repeat(80));
  console.log('');

  try {
    await initDatabase();
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      // Find the section
      const findSectionQuery = `
        SELECT s.id 
        FROM sections s 
        JOIN modules m ON s.module_id = m.id 
        WHERE m.display_name = 'Security Awareness Essentials' 
        AND s.display_name = 'Phishing and Social Engineering'
        AND s.order_index = 1
      `;

      db.get(findSectionQuery, [], (err, section) => {
        if (err) {
          console.error('Error finding section:', err);
          reject(err);
          return;
        }

        if (!section) {
          console.error('Section not found!');
          reject(new Error('Section not found'));
          return;
        }

        const sectionId = section.id;
        console.log(`Found section ID: ${sectionId}`);
        console.log('');

        // Get the current Introduction content
        db.get(
          'SELECT * FROM learning_content WHERE section_id = ? AND screen_title = ?',
          [sectionId, 'Introduction'],
          (err, introContent) => {
            if (err) {
              console.error('Error fetching Introduction content:', err);
              reject(err);
              return;
            }

            if (!introContent) {
              console.error('Introduction content not found!');
              reject(new Error('Introduction content not found'));
              return;
            }

            console.log('Current Introduction content found.');
            console.log('');

            // Remove references section
            // The introduction should end at "How to recognize and respond to these threats safely"
            const newContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks (phishing, vishing, smishing, pretexting, baiting, tailgating)
• The psychological tactics attackers use
• How to recognize and respond to these threats safely`;

            // Update the content
            db.run(
              'UPDATE learning_content SET content_markdown = ? WHERE section_id = ? AND screen_title = ?',
              [newContent, sectionId, 'Introduction'],
              function(err) {
                if (err) {
                  console.error('Error updating Introduction content:', err);
                  reject(err);
                  return;
                }

                console.log('✓ Successfully removed References from Introduction page');
                console.log('');
                console.log('Updated content:');
                console.log(newContent);
                console.log('');
                console.log('='.repeat(80));
                console.log('Update completed successfully!');
                console.log('='.repeat(80));
                
                resolve();
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  removeIntroReferences()
    .then(() => {
      console.log('');
      console.log('Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('');
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeIntroReferences };

