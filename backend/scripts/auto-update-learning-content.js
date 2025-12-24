const { initDatabase, getDatabase } = require('../database/init');

/**
 * Auto-update script that can be run on server startup
 * This version checks if update is needed before running
 * Safe to run on every deployment
 */

// Embedded data - same as nuclear-update-learning-content.js
const csvData = [
  {
    Topic: "Understanding social engineering tactics (the \"why it works\")",
    Teaching_Material: "Social engineering is a set of manipulation techniques that gets people to voluntarily give access, information, or actions—because the attacker exploits human defaults like trust, urgency, and emotion rather than breaking technology. A common pattern is: research → establish trust → apply pressure or incentives → get the action → exit cleanly. Train learners to notice 'push buttons' such as urgency (\"do this now\"), authority (\"I'm IT/bank/boss\"), fear (\"account locked\"), scarcity (\"last chance\"), and helpfulness (\"can you quickly…?\"). The core defensive habit is to pause and verify using a trusted channel—not the one provided in the message or call.",
    Activity_Prompt: "Quick prompt: \"Which is stronger at work: politeness, speed, or safety? When do we trade one for another?\"",
    References: "https://www.imperva.com/learn/application-security/social-engineering-attack/; https://www.ibm.com/think/topics/social-engineering; https://www.microsoft.com/en-us/microsoft-365-life-hacks/privacy-and-safety/what-is-social-engineering; https://www.scripps.org/sparkle-assets/documents/avoiding_social_engineering_and_phishing_attacks_us-cert.pdf"
  },
  {
    Topic: "Phishing (email): \"the inbox trap\"",
    Teaching_Material: "Email phishing impersonates trusted senders (banks, vendors, HR/IT, leadership) to push you to click a link, open a file, log in, or pay. Emphasize that legitimate organizations don't ask for credentials via email, and teach learners to hover over links (check the actual URL), verify sender addresses carefully, and look for urgency/grammar red flags. When in doubt, contact the organization through a known channel (not the one in the email).",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/phishing-attack/; https://www.ibm.com/think/topics/phishing; https://www.microsoft.com/en-us/microsoft-365-life-hacks/privacy-and-safety/what-is-phishing"
  },
  {
    Topic: "Vishing (voice): \"the convincing caller\"",
    Teaching_Material: "Vishing is phishing by phone/voice, and it often succeeds because voice adds social pressure and the caller can adapt in real time. Teach learners to never give information to unsolicited callers, even if they claim to be from IT, the bank, or law enforcement. Verify by hanging up and calling back using a known number (not the one provided).",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/vishing/; https://www.ibm.com/think/topics/vishing"
  },
  {
    Topic: "Smishing (SMS/text): \"fast taps, big consequences\"",
    Teaching_Material: "Smishing is phishing via SMS or messaging apps. Attackers rely on reflexive tapping and high open rates. Common lures include delivery/toll/bank alerts, account verification, or prize notifications. Train learners to treat texts like emails: verify before clicking, and never share codes or passwords via text.",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/smishing/; https://www.ibm.com/think/topics/smishing"
  },
  {
    Topic: "Pretexting: \"the believable story\"",
    Teaching_Material: "Pretexting is when an attacker invents a scenario (the pretext) to justify why you should give information or perform an action—often by impersonating authority (IT support, HR, vendor, executive). The story sounds plausible, but it's fabricated. Defense: verify identity through a separate, trusted channel before sharing anything.",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/pretexting/; https://www.ibm.com/think/topics/pretexting"
  },
  {
    Topic: "Baiting: \"free stuff that costs you\"",
    Teaching_Material: "Baiting offers something enticing—free downloads, gift cards, 'leaked payroll,' or even a physical USB drive—hoping curiosity does the rest. The classic rule applies: if it seems too good to be true, it probably is. Never plug in unknown USB devices, and be skeptical of 'free' offers that require you to download something or enter credentials.",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/baiting/; https://www.ibm.com/think/topics/baiting"
  },
  {
    Topic: "Tailgating (physical): \"the door-hold exploit\"",
    Teaching_Material: "Tailgating (piggybacking) is a physical social engineering attack where someone without access enters a restricted area by following an authorized person. Attackers exploit politeness and the assumption that if someone is already inside, they must be authorized. Defense: never hold doors open for strangers, always verify badges, and report suspicious behavior.",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/tailgating/; https://www.ibm.com/think/topics/tailgating"
  },
  {
    Topic: "Wrap-up checklist (Stop. Verify. Report.)",
    Teaching_Material: "1) Pause when you feel rushed or emotionally pushed. 2) Verify out-of-band: use known numbers/sites/apps; don't trust caller ID or embedded links. 3) Report suspicious activity to IT/security immediately. 4) When in doubt, don't act—ask for help. These habits turn social engineering attempts into learning opportunities rather than security incidents.",
    Activity_Prompt: "",
    References: "https://www.imperva.com/learn/application-security/social-engineering-attack/; https://www.ibm.com/think/topics/social-engineering"
  }
];

function formatReferences(refs) {
  if (!refs || refs.trim() === '') return '';
  const refArray = refs.split(';').map(r => r.trim()).filter(r => r);
  if (refArray.length === 0) return '';
  let formatted = '\n\n## References\n\n';
  refArray.forEach((ref, index) => {
    formatted += `${index + 1}. [${ref}](${ref})\n`;
  });
  return formatted;
}

function formatContent(row) {
  let content = '';
  const teachingMaterial = row['Teaching_Material'] || row.Teaching_Material || '';
  const activityPrompt = row['Activity_Prompt'] || row.Activity_Prompt || '';
  const references = row['References'] || row.References || '';
  
  if (teachingMaterial) {
    content += teachingMaterial;
  }
  
  if (activityPrompt && activityPrompt.trim() !== '') {
    content += `\n\n💡 **Activity:** ${activityPrompt}`;
  }
  
  if (references && references.trim() !== '') {
    content += formatReferences(references);
  }
  
  return content;
}

/**
 * Check if content needs updating by checking:
 * 1. If Introduction has references (should not)
 * 2. If we have 8 separate concept pages (not 1 combined "Key Concepts")
 */
function needsUpdate(db, sectionId) {
  return new Promise((resolve, reject) => {
    // Get Introduction
    db.get(
      'SELECT content_markdown, order_index FROM learning_content WHERE section_id = ? AND screen_title = ?',
      [sectionId, 'Introduction'],
      (err, introRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!introRow) {
          // No Introduction found - needs update
          console.log('[Auto-Update] Update needed: Introduction not found');
          resolve(true);
          return;
        }
        
        // Check if Introduction has references (should not have them)
        const hasReferences = introRow.content_markdown.includes('References:') || 
                             introRow.content_markdown.includes('## References') ||
                             introRow.content_markdown.includes('formatReferences');
        
        // Check if we have separate concept pages (should have 8, not 1 combined "Key Concepts")
        db.all(
          'SELECT screen_title FROM learning_content WHERE section_id = ? AND order_index > ? ORDER BY order_index',
          [sectionId, introRow.order_index || 1],
          (err, conceptPages) => {
            if (err) {
              reject(err);
              return;
            }
            
            // Filter out "Real World Examples" and similar
            const actualConcepts = conceptPages.filter(c => 
              !c.screen_title.toLowerCase().includes('example')
            );
            
            // Check if we have a combined "Key Concepts" page (bad) or separate pages (good)
            const hasKeyConceptsPage = actualConcepts.some(c => 
              c.screen_title === 'Key Concepts'
            );
            
            // Needs update if:
            // 1. Introduction has references, OR
            // 2. We have a combined "Key Concepts" page (should be split), OR
            // 3. We don't have exactly 8 separate concept pages
            const needsUpdate = hasReferences || hasKeyConceptsPage || actualConcepts.length !== 8;
            
            if (needsUpdate) {
              console.log(`[Auto-Update] Update needed: hasReferences=${hasReferences}, hasKeyConceptsPage=${hasKeyConceptsPage}, conceptPages=${actualConcepts.length} (expected 8)`);
            }
            
            resolve(needsUpdate);
          }
        );
      }
    );
  });
}

async function autoUpdate() {
  try {
    await initDatabase();
    const db = getDatabase();
    
    // Find section
    const findSectionQuery = `
      SELECT s.id 
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;
    
    return new Promise((resolve, reject) => {
      db.get(findSectionQuery, [], async (err, section) => {
        if (err) {
          console.error('[Auto-Update] Error finding section:', err);
          reject(err);
          return;
        }
        
        if (!section) {
          console.log('[Auto-Update] Section not found, skipping update');
          resolve(false);
          return;
        }
        
        const sectionId = section.id;
        
        // Check if update is needed
        try {
          const updateNeeded = await needsUpdate(db, sectionId);
          
          if (!updateNeeded) {
            console.log('[Auto-Update] Content is already up to date, skipping update');
            resolve(false);
            return;
          }
          
          console.log('[Auto-Update] Content needs updating, starting update...');
          
          // Get all content IDs for this section
          db.all('SELECT id FROM learning_content WHERE section_id = ?', [sectionId], (err, allContent) => {
            if (err) {
              console.error('[Auto-Update] Error finding content:', err);
              reject(err);
              return;
            }
            
            const contentIds = allContent.map(c => c.id);
            
            // Delete user progress
            if (contentIds.length > 0) {
              db.run(`DELETE FROM user_learning_progress WHERE learning_content_id IN (${contentIds.map(() => '?').join(',')})`, 
                contentIds, (err) => {
                  if (err) {
                    console.error('[Auto-Update] Warning: Error deleting user progress:', err);
                  }
                  deleteAndInsert();
                });
            } else {
              deleteAndInsert();
            }
            
            function deleteAndInsert() {
              // Save the "Real-World Examples" page if it exists before deleting
              db.get('SELECT * FROM learning_content WHERE section_id = ? AND screen_title = ?', 
                [sectionId, 'Real-World Examples'], (err, examplesPage) => {
                  if (err) {
                    console.error('[Auto-Update] Error checking for Real-World Examples:', err);
                    // Continue anyway
                  }
                  
                  const savedExamplesPage = examplesPage; // Save for later restoration
                  
                  // Delete ALL learning content for this section (we'll restore Real-World Examples after)
                  db.run('DELETE FROM learning_content WHERE section_id = ?', [sectionId], (err) => {
                    if (err) {
                      console.error('[Auto-Update] Error deleting content:', err);
                      reject(err);
                      return;
                    }
                    
                    // Build Introduction WITHOUT references
                    const introductionContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks (phishing, vishing, smishing, pretexting, baiting, tailgating)
• The psychological tactics attackers use
• How to recognize and respond to these threats safely`;
                    
                    // Insert Introduction (without references)
                    db.run(
                      'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                      [sectionId, 'Introduction', 2, introductionContent, 1],
                      function(err) {
                        if (err) {
                          console.error('[Auto-Update] Error inserting Introduction:', err);
                          reject(err);
                          return;
                        }
                        
                        console.log('[Auto-Update] ✓ Inserted Introduction (without references)');
                        
                        // Insert individual concept pages (one per concept)
                        let currentOrderIndex = 2;
                        let insertCount = 0;
                        
                        function insertNextConcept(index) {
                          if (index >= csvData.length) {
                            // All concepts inserted, now restore Real-World Examples if it existed
                            if (savedExamplesPage) {
                              // Place it after all concept pages (order_index = 1 + 8 concepts + 1 = 10)
                              const examplesOrderIndex = currentOrderIndex;
                              db.run(
                                'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                                [sectionId, savedExamplesPage.screen_title, savedExamplesPage.read_time_min, savedExamplesPage.content_markdown, examplesOrderIndex],
                                function(err) {
                                  if (err) {
                                    console.error('[Auto-Update] Error restoring Real-World Examples:', err);
                                    // Don't fail - just log the error
                                  } else {
                                    console.log('[Auto-Update] ✓ Restored "Real-World Examples" page');
                                  }
                                  console.log(`[Auto-Update] ✓ Successfully created ${insertCount} separate concept pages`);
                                  console.log('[Auto-Update] ✅ Learning content updated successfully!');
                                  resolve(true);
                                }
                              );
                            } else {
                              console.log(`[Auto-Update] ✓ Successfully created ${insertCount} separate concept pages`);
                              console.log('[Auto-Update] ✅ Learning content updated successfully!');
                              resolve(true);
                            }
                            return;
                          }
                          
                          const row = csvData[index];
                          const topic = row['Topic'] || row.Topic;
                          const conceptContent = formatContent(row);
                          
                          const wordCount = conceptContent.split(/\s+/).length;
                          const readTime = Math.max(1, Math.ceil(wordCount / 200));
                          
                          db.run(
                            'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                            [sectionId, topic, readTime, conceptContent, currentOrderIndex],
                            function(err) {
                              if (err) {
                                console.error(`[Auto-Update] Error inserting concept "${topic}":`, err);
                                reject(err);
                                return;
                              }
                              
                              insertCount++;
                              console.log(`[Auto-Update] ✓ Created page ${insertCount}: "${topic}"`);
                              currentOrderIndex++;
                              
                              insertNextConcept(index + 1);
                            }
                          );
                        }
                        
                        insertNextConcept(0);
                      }
                    );
                  });
                });
            }
          });
        } catch (checkErr) {
          console.error('[Auto-Update] Error checking if update needed:', checkErr);
          reject(checkErr);
        }
      });
    });
  } catch (error) {
    console.error('[Auto-Update] Fatal error:', error);
    throw error;
  }
}

module.exports = { autoUpdate };

