const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { initDatabase, getDatabase } = require('../database/init');

// Helper function to format citations
function formatCitations(row) {
  const citations = [];
  
  // Check each source (1-3)
  for (let i = 1; i <= 3; i++) {
    const titleKey = `Source ${i} (Title)`;
    const urlKey = `Source ${i} (URL)`;
    
    if (row[titleKey] && row[urlKey] && row[urlKey].trim() !== '') {
      citations.push({
        title: row[titleKey].trim(),
        url: row[urlKey].trim()
      });
    }
  }
  
  if (citations.length === 0) return '';
  
  // Format as markdown links with better styling
  const citationLinks = citations.map((cite, index) => {
    return `[${cite.title}](${cite.url})`;
  }).join(', ');
  
  return `\n\n**Sources:** ${citationLinks}`;
}

// Helper function to format content with examples
function formatContent(row) {
  let content = row['Condensed learning material'] || '';
  
  // Add common indicators if present
  if (row['Common indicators / examples'] && row['Common indicators / examples'].trim() !== '') {
    content += `\n\n**Common indicators/examples:** ${row['Common indicators / examples']}`;
  }
  
  // Add safe response if present
  if (row['Safe response (default)'] && row['Safe response (default)'].trim() !== '') {
    content += `\n\n**Safe response:** ${row['Safe response (default)']}`;
  }
  
  // Add citations
  content += formatCitations(row);
  
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
    path.join(__dirname, '../../social_engineering_learning_material.csv'),
    path.join(__dirname, '../../../social_engineering_learning_material.csv'),
    'C:\\Users\\yoga\\Downloads\\social_engineering_learning_material.csv'
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
              
              // First, delete user learning progress for this section's content (due to foreign key constraint)
              db.run(`
                DELETE FROM user_learning_progress 
                WHERE learning_content_id IN (
                  SELECT id FROM learning_content WHERE section_id = ?
                )
              `, [sectionId], (err) => {
                if (err) {
                  console.error('Error deleting user progress:', err);
                  reject(err);
                  return;
                }
                
                console.log('Deleted user learning progress for section');
                
                // Then delete existing learning content for this section
                db.run('DELETE FROM learning_content WHERE section_id = ?', [sectionId], (err) => {
                  if (err) {
                    console.error('Error deleting existing content:', err);
                    reject(err);
                    return;
                  }
                  
                  console.log('Deleted existing learning content');
              
              // Create Introduction page
              const introductionContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks
• The psychological tactics attackers use
• How to recognize and respond to these threats safely

Let's begin your journey to becoming more security-aware!`;
              
              // Create Key Concepts page
              let keyConceptsContent = `## Key Concepts in Social Engineering\n\n`;
              
              // Organize content by type
              const keyConcepts = results.filter(r => r.Section === 'Key concept');
              const attackTypes = results.filter(r => r.Section === 'Attack type');
              const humanLevers = results.filter(r => r.Section === 'Human lever');
              const safeResponses = results.filter(r => r.Section === 'Safe response');
              
              // Add Key Concept (Social Engineering definition)
              if (keyConcepts.length > 0) {
                keyConceptsContent += `### ${keyConcepts[0].Item}\n\n`;
                keyConceptsContent += formatContent(keyConcepts[0]);
                keyConceptsContent += '\n\n';
              }
              
              // Add Attack Types
              if (attackTypes.length > 0) {
                keyConceptsContent += `## Types of Social Engineering Attacks\n\n`;
                attackTypes.forEach((row, index) => {
                  keyConceptsContent += `### ${row.Item}\n\n`;
                  keyConceptsContent += formatContent(row);
                  keyConceptsContent += '\n\n';
                });
              }
              
              // Add Human Levers
              if (humanLevers.length > 0) {
                keyConceptsContent += `## Psychological Tactics Used by Attackers\n\n`;
                humanLevers.forEach((row, index) => {
                  keyConceptsContent += `### ${row.Item}\n\n`;
                  keyConceptsContent += formatContent(row);
                  keyConceptsContent += '\n\n';
                });
              }
              
              // Add Safe Responses
              if (safeResponses.length > 0) {
                keyConceptsContent += `## Safe Response Strategies\n\n`;
                safeResponses.forEach((row, index) => {
                  keyConceptsContent += `### ${row.Item}\n\n`;
                  keyConceptsContent += formatContent(row);
                  keyConceptsContent += '\n\n';
                });
              }
              
              // Insert Introduction (order_index 1)
              db.run(
                'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                [sectionId, 'Introduction', 2, introductionContent, 1],
                function(err) {
                  if (err) {
                    console.error('Error inserting Introduction:', err);
                    reject(err);
                    return;
                  }
                  console.log('✓ Created Introduction page');
                  
                  // Insert Key Concepts (order_index 2)
                  db.run(
                    'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                    [sectionId, 'Key Concepts', 10, keyConceptsContent, 2],
                    function(err) {
                      if (err) {
                        console.error('Error inserting Key Concepts:', err);
                        reject(err);
                        return;
                      }
                      console.log('✓ Created Key Concepts page');
                      console.log('\nUpdate completed successfully!');
                      resolve();
                    }
                  );
                }
              );
                }
              );
              }
            );
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

