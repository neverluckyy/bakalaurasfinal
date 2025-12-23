const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { initDatabase, getDatabase } = require('../database/init');

// Helper function to format references from the new CSV format
function formatReferences(referencesStr) {
  if (!referencesStr || referencesStr.trim() === '') return '';
  
  // Split by semicolon and clean up URLs
  const urls = referencesStr.split(';').map(url => url.trim()).filter(url => url);
  
  if (urls.length === 0) return '';
  
  // Format as markdown links
  const citationLinks = urls.map((url, index) => {
    // Try to extract a title from the URL, or use a generic title
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      return `[${domain}](${url})`;
    } catch (e) {
      return `[Reference ${index + 1}](${url})`;
    }
  }).join(', ');
  
  return `\n\n**References:** ${citationLinks}`;
}

// Helper function to format content from the new CSV format
function formatContent(row) {
  let content = row['Teaching_Material'] || '';
  
  // Add activity prompt if present
  if (row['Activity_Prompt'] && row['Activity_Prompt'].trim() !== '') {
    content += `\n\n**Activity:** ${row['Activity_Prompt']}`;
  }
  
  // Add references
  if (row['References'] && row['References'].trim() !== '') {
    content += formatReferences(row['References']);
  }
  
  return content;
}

async function updateModule1Section1() {
  console.log('Starting update for Module 1 Section 1...');
  
  // Initialize database
  await initDatabase();
  console.log('Database initialized successfully');
  
  const db = getDatabase();
  // Try multiple possible locations for the CSV file
  const possiblePaths = [
    'C:\\Users\\yoga\\Downloads\\teaching_material_social_engineering.csv',
    path.join(__dirname, '../../teaching_material_social_engineering.csv'),
    path.join(__dirname, '../../../teaching_material_social_engineering.csv'),
    path.join(__dirname, '../../social_engineering_learning_material.csv'),
    path.join(__dirname, '../../../social_engineering_learning_material.csv')
  ];
  
  let csvFilePath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      csvFilePath = possiblePath;
      break;
    }
  }
  
  if (!csvFilePath) {
    console.error('CSV file not found. Tried:', possiblePaths);
    process.exit(1);
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found:', csvFilePath);
    process.exit(1);
  }
  
  const results = [];
  
  return new Promise((resolve, reject) => {
    // Read CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Read ${results.length} rows from CSV`);
        
        try {
          // Find Module 1 Section 1
          const findSectionQuery = `
            SELECT s.id 
            FROM sections s 
            JOIN modules m ON s.module_id = m.id 
            WHERE m.display_name = 'Security Awareness Essentials' 
            AND s.display_name = 'Phishing and Social Engineering'
            AND s.order_index = 1
          `;
          
          db.get(findSectionQuery, [], async (err, sectionResult) => {
            if (err) {
              console.error('Error finding section:', err);
              reject(err);
              return;
            }
            
            if (!sectionResult) {
              console.error('Module 1 Section 1 not found');
              reject(new Error('Section not found'));
              return;
            }
            
            const sectionId = sectionResult.id;
            console.log(`Found section ID: ${sectionId}`);
            
            // First, get existing content to preserve Real World Examples and other content
            db.all('SELECT * FROM learning_content WHERE section_id = ? ORDER BY order_index', [sectionId], (err, existingContent) => {
              if (err) {
                console.error('Error fetching existing content:', err);
                reject(err);
                return;
              }
              
              // Find Real World Examples and other content to preserve
              const realWorldExamples = existingContent.find(c => 
                c.screen_title.toLowerCase().includes('real world') || 
                c.screen_title.toLowerCase().includes('example')
              );
              
              const otherContent = existingContent.filter(c => 
                c.screen_title !== 'Introduction' && 
                c.screen_title !== 'Key Concepts' &&
                !c.screen_title.toLowerCase().includes('real world') &&
                !c.screen_title.toLowerCase().includes('example')
              );
              
              console.log(`Found ${existingContent.length} existing content items`);
              if (realWorldExamples) {
                console.log(`Preserving: ${realWorldExamples.screen_title}`);
              }
              otherContent.forEach(c => {
                console.log(`Preserving: ${c.screen_title}`);
              });
              
              // Get the first row from CSV for Introduction and Key Concepts
              const firstRow = results[0];
              if (!firstRow || !firstRow['Topic']) {
                console.error('CSV file does not contain expected data');
                reject(new Error('Invalid CSV format'));
                return;
              }
              
              // Create Introduction page - welcome message based on first row concept
              const introductionContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks (phishing, vishing, smishing, pretexting, baiting, tailgating)
• The psychological tactics attackers use
• How to recognize and respond to these threats safely

${formatReferences(firstRow['References'])}`;
              
              // Create Key Concepts page - use first row for core concept
              let keyConceptsContent = `## ${firstRow['Topic']}\n\n`;
              keyConceptsContent += formatContent(firstRow);
              
              // Add other topics from CSV as subsections
              if (results.length > 1) {
                keyConceptsContent += '\n\n## Types of Social Engineering Attacks\n\n';
                
                // Skip first row (already used) and process others
                for (let i = 1; i < results.length; i++) {
                  const row = results[i];
                  if (row['Topic'] && row['Teaching_Material']) {
                    keyConceptsContent += `### ${row['Topic']}\n\n`;
                    keyConceptsContent += formatContent(row);
                    keyConceptsContent += '\n\n';
                  }
                }
              }
              
              // Delete user learning progress only for Introduction and Key Concepts
              db.all('SELECT id FROM learning_content WHERE section_id = ? AND (screen_title = ? OR screen_title = ?)', 
                [sectionId, 'Introduction', 'Key Concepts'], 
                (err, contentToDelete) => {
                  if (err) {
                    console.error('Error finding content to delete:', err);
                    reject(err);
                    return;
                  }
                  
                  const contentIds = contentToDelete.map(c => c.id);
                  if (contentIds.length > 0) {
                    db.run(`DELETE FROM user_learning_progress WHERE learning_content_id IN (${contentIds.map(() => '?').join(',')})`, 
                      contentIds, (err) => {
                        if (err) {
                          console.error('Error deleting user progress:', err);
                          reject(err);
                          return;
                        }
                        console.log('Deleted user learning progress for Introduction and Key Concepts');
                        updateContent();
                      });
                  } else {
                    updateContent();
                  }
                  
                  function updateContent() {
                    // Delete existing Introduction and Key Concepts
                    db.run('DELETE FROM learning_content WHERE section_id = ? AND (screen_title = ? OR screen_title = ?)', 
                      [sectionId, 'Introduction', 'Key Concepts'], 
                      (err) => {
                        if (err) {
                          console.error('Error deleting existing Introduction/Key Concepts:', err);
                          reject(err);
                          return;
                        }
                        
                        console.log('Deleted existing Introduction and Key Concepts');
                        
                        // Insert updated Introduction (order_index 1)
                        db.run(
                          'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                          [sectionId, 'Introduction', 2, introductionContent, 1],
                          function(err) {
                            if (err) {
                              console.error('Error inserting Introduction:', err);
                              reject(err);
                              return;
                            }
                            console.log('✓ Updated Introduction page');
                            
                            // Insert updated Key Concepts (order_index 2)
                            db.run(
                              'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                              [sectionId, 'Key Concepts', 10, keyConceptsContent, 2],
                              function(err) {
                                if (err) {
                                  console.error('Error inserting Key Concepts:', err);
                                  reject(err);
                                  return;
                                }
                                console.log('✓ Updated Key Concepts page');
                                console.log('\nUpdate completed successfully!');
                                console.log('Real World Examples and other content preserved.');
                                resolve();
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                }
              );
            });
          });
        } catch (error) {
          console.error('Error during update:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Run if executed directly
if (require.main === module) {
  updateModule1Section1()
    .then(() => {
      console.log('Update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateModule1Section1 };

