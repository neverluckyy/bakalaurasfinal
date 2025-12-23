const { initDatabase, getDatabase } = require('../database/init');

/**
 * NUCLEAR UPDATE: Deletes ALL learning content for section 1 and rebuilds it
 * This ensures the database matches the expected structure exactly
 * Use this if force-update-learning-content.js didn't work
 */

// Embedded data - same as force-update-learning-content.js
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

async function nuclearUpdate() {
  console.log('='.repeat(80));
  console.log('NUCLEAR UPDATE: Complete Learning Content Rebuild');
  console.log('='.repeat(80));
  console.log('');
  console.log('⚠️  WARNING: This will DELETE ALL learning content for section 1');
  console.log('   and rebuild it from scratch. This cannot be undone!');
  console.log('');
  
  await initDatabase();
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Find section
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
        console.error('❌ Error finding section:', err);
        reject(err);
        return;
      }
      
      if (!section) {
        console.error('❌ Section not found!');
        reject(new Error('Section not found'));
        return;
      }
      
      const sectionId = section.id;
      console.log(`✓ Found section ID: ${sectionId}`);
      console.log('');
      
      // STEP 1: Get all content IDs for this section
      console.log('Step 1: Finding all existing content...');
      db.all('SELECT id FROM learning_content WHERE section_id = ?', [sectionId], (err, allContent) => {
        if (err) {
          console.error('❌ Error finding content:', err);
          reject(err);
          return;
        }
        
        const contentIds = allContent.map(c => c.id);
        console.log(`   Found ${contentIds.length} existing content items`);
        console.log('');
        
        // STEP 2: Delete all user progress for this section's content
        if (contentIds.length > 0) {
          console.log('Step 2: Deleting user progress...');
          db.run(`DELETE FROM user_learning_progress WHERE learning_content_id IN (${contentIds.map(() => '?').join(',')})`, 
            contentIds, (err) => {
              if (err) {
                console.error('⚠️  Warning: Error deleting user progress:', err);
              } else {
                console.log(`   ✓ Deleted user progress for ${contentIds.length} items`);
              }
              deleteAllContent();
            });
        } else {
          deleteAllContent();
        }
        
        function deleteAllContent() {
          // STEP 3: Delete ALL learning content for this section
          console.log('');
          console.log('Step 3: Deleting ALL learning content...');
          db.run('DELETE FROM learning_content WHERE section_id = ?', [sectionId], (err) => {
            if (err) {
              console.error('❌ Error deleting content:', err);
              reject(err);
              return;
            }
            console.log('   ✓ Deleted all existing content');
            console.log('');
            
            // STEP 4: Build and insert new content
            console.log('Step 4: Building new content structure...');
            
            const firstRow = csvData[0];
            const firstRowTopic = firstRow['Topic'] || firstRow.Topic;
            const firstRowReferences = firstRow['References'] || firstRow.References || '';
            
            // Build Introduction content
            const introductionContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks (phishing, vishing, smishing, pretexting, baiting, tailgating)
• The psychological tactics attackers use
• How to recognize and respond to these threats safely

${formatReferences(firstRowReferences)}`;
            
            // Build Key Concepts content
            let keyConceptsContent = `## ${firstRowTopic}\n\n`;
            keyConceptsContent += formatContent(firstRow);
            
            if (csvData.length > 1) {
              keyConceptsContent += '\n\n## Types of Social Engineering Attacks\n\n';
              for (let i = 1; i < csvData.length; i++) {
                const row = csvData[i];
                const topic = row['Topic'] || row.Topic;
                const teachingMaterial = row['Teaching_Material'] || row.Teaching_Material;
                if (topic && teachingMaterial) {
                  keyConceptsContent += `### ${topic}\n\n`;
                  keyConceptsContent += formatContent(row);
                  keyConceptsContent += '\n\n';
                }
              }
            }
            
            console.log('   ✓ Built Introduction content');
            console.log('   ✓ Built Key Concepts content');
            console.log('');
            
            // STEP 5: Insert Introduction
            console.log('Step 5: Inserting new content...');
            db.run(
              'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
              [sectionId, 'Introduction', 2, introductionContent, 1],
              function(err) {
                if (err) {
                  console.error('❌ Error inserting Introduction:', err);
                  reject(err);
                  return;
                }
                const introId = this.lastID;
                console.log(`   ✓ Inserted Introduction (ID: ${introId})`);
                
                // STEP 6: Insert Key Concepts
                db.run(
                  'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
                  [sectionId, 'Key Concepts', 10, keyConceptsContent, 2],
                  function(err) {
                    if (err) {
                      console.error('❌ Error inserting Key Concepts:', err);
                      reject(err);
                      return;
                    }
                    const keyConceptsId = this.lastID;
                    console.log(`   ✓ Inserted Key Concepts (ID: ${keyConceptsId})`);
                    console.log('');
                    
                    // STEP 7: Verify
                    console.log('Step 6: Verifying update...');
                    db.all('SELECT id, screen_title, order_index, LENGTH(content_markdown) as len FROM learning_content WHERE section_id = ? ORDER BY order_index', 
                      [sectionId], 
                      (err, verify) => {
                        if (err) {
                          console.error('❌ Error verifying:', err);
                        } else {
                          console.log('');
                          console.log('   Content Summary:');
                          verify.forEach(item => {
                            console.log(`   ✓ ${item.screen_title} (ID: ${item.id}, order: ${item.order_index}, length: ${item.len} chars)`);
                          });
                        }
                        
                        console.log('');
                        console.log('='.repeat(80));
                        console.log('✅ NUCLEAR UPDATE COMPLETED SUCCESSFULLY!');
                        console.log('='.repeat(80));
                        console.log('');
                        console.log('The learning content has been completely rebuilt.');
                        console.log('The new content should now be visible on the website.');
                        console.log('');
                        console.log('If you still see old content:');
                        console.log('  1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');
                        console.log('  2. Clear browser cache completely');
                        console.log('  3. Open in incognito/private mode');
                        console.log('  4. Wait 1-2 minutes for Railway to restart if needed');
                        console.log('');
                        
                        resolve();
                      }
                    );
                  }
                );
              }
            );
          });
        }
      });
    });
  });
}

// Run the update
nuclearUpdate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

