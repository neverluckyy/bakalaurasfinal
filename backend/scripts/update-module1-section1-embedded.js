const { initDatabase, getDatabase } = require('../database/init');

// ============================================================================
// EMBEDDED DATA - Update this section with your CSV data
// ============================================================================
// Format: Each object should have: Topic, Teaching_Material, Activity_Prompt, References
// Copy your CSV data here, converting each row to an object like this:
//
// const csvData = [
//   {
//     Topic: "Social Engineering Overview",
//     Teaching_Material: "Social engineering is...",
//     Activity_Prompt: "Think about...",
//     References: "https://example.com;https://another.com"
//   },
//   {
//     Topic: "Phishing",
//     Teaching_Material: "Phishing is...",
//     Activity_Prompt: "",
//     References: "https://example.com"
//   }
// ];

const csvData = [
  {
    Topic: "Understanding social engineering tactics (the \"why it works\")",
    Teaching_Material: "Social engineering is a set of manipulation techniques that gets people to voluntarily give access, information, or actions—because the attacker exploits human defaults like trust, urgency, and emotion rather than breaking technology. A common pattern is: research → establish trust → apply pressure or incentives → get the action → exit cleanly. Train learners to notice 'push buttons' such as urgency (\"do this now\"), authority (\"I'm IT/bank/boss\"), fear (\"account locked\"), scarcity (\"last chance\"), and helpfulness (\"can you quickly…?\"). The core defensive habit is to pause and verify using a trusted channel—not the one provided in the message or call.",
    Activity_Prompt: "Quick prompt: \"Which is stronger at work: politeness, speed, or safety? When do we trade one for another?\"",
    References: "https://www.imperva.com/learn/application-security/social-engineering-attack/; https://www.ibm.com/think/topics/social-engineering; https://www.microsoft.com/en-us/microsoft-365-life-hacks/privacy-and-safety/what-is-social-engineering; https://www.scripps.org/sparkle-assets/documents/avoiding_social_engineering_and_phishing_attacks_us-cert.pdf"
  },
  {
    Topic: "Phishing (email): \"the inbox trap\"",
    Teaching_Material: "Email phishing impersonates trusted senders (banks, vendors, HR/IT, leadership) to push you to click a link, open a file, log in, or pay. Emphasize the triad: a sudden problem + a requested action + a reason you can't double-check (\"today only,\" \"final warning,\" \"CEO needs this now\"). Teach 'safe verification': don't use links/phone numbers in the email; instead, go to the site/app manually or use a known number. Highlight spoofing: small changes in addresses/URLs can look legitimate at a glance. Encourage reporting suspicious messages early, and reinforce MFA as a safety net.",
    Activity_Prompt: "Mini-exercise: Show a sample email. Ask: \"What's the requested action? What's the pressure? What's the independent verification step?\"",
    References: "https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/phishing; https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams; https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/spoofing-and-phishing; https://www.cisa.gov/sites/default/files/publications/emailscams_0905.pdf; https://www.scripps.org/sparkle-assets/documents/avoiding_social_engineering_and_phishing_attacks_us-cert.pdf"
  },
  {
    Topic: "Vishing (voice): \"the convincing caller\"",
    Teaching_Material: "Vishing is phishing by phone/voice, and it often succeeds because voice adds social pressure and the caller can adapt in real time. Teach learners to watch for authority + urgency + secrecy (\"I'm from the bank/IT/police; don't tell anyone; we must do this now\"). Caller ID can be spoofed, so 'it looks legit' is not proof. The best habit is a short script: hang up, then call back using a trusted number (company directory, official website, saved contact). Never share passwords, one-time codes, or payment details with an unsolicited caller.",
    Activity_Prompt: "Role-play: One person is \"IT support\" asking for a login code; the other practices: \"I can't do that. I'll call the helpdesk number.\"",
    References: "https://www.ic3.gov/PSA/2025/PSA250515; https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/spoofing-and-phishing; https://www.fcc.gov/consumers/guides/spoofing; https://www.ncsc.admin.ch/ncsc/en/home/cyberbedrohungen/phishing.html"
  },
  {
    Topic: "Smishing (SMS/text): \"fast taps, big consequences\"",
    Teaching_Material: "Smishing is phishing via SMS or messaging apps. Attackers rely on reflexive tapping and high open rates. Common lures include delivery/toll/bank alerts, 'confirm your account' requests, or short links to fake login pages. Some scams spoof sender IDs so messages appear in the same thread as genuine texts from a company. Defenses: don't click links in unsolicited texts, verify via the official app/site, and report/block per your organization's process.",
    Activity_Prompt: "Mini-exercise: Rewrite a smish into a safer, legitimate-style alert (hint: \"Open the app\" / \"type the URL yourself,\" no pressure links).",
    References: "https://www.ic3.gov/PSA/2025/PSA250515; https://consumer.ftc.gov/articles/how-recognize-report-spam-text-messages; https://www.ncsc.admin.ch/ncsc/en/home/cyberbedrohungen/phishing.html"
  },
  {
    Topic: "Pretexting: \"the believable story\"",
    Teaching_Material: "Pretexting is when an attacker invents a scenario (the pretext) to justify why you should give information or perform an action—often by impersonating a vendor, auditor, new employee, or another department. Attackers may do homework first (names, org chart, current projects) so the story feels internally consistent. Train learners to separate story from permission: even a plausible story doesn't make the request authorized. Use an identity-and-authorization routine: verify via known channels, confirm the request is appropriate for the role, and share the minimum necessary—or escalate.",
    Activity_Prompt: "Discussion: \"Name 3 things you should never give based on a story alone.\" (Passwords, MFA codes, payment/bank changes.)",
    References: "https://www.ibm.com/think/topics/pretexting; https://www.imperva.com/learn/application-security/social-engineering-attack/; https://www.microsoft.com/en-us/microsoft-365-life-hacks/privacy-and-safety/what-is-social-engineering"
  },
  {
    Topic: "Baiting: \"free stuff that costs you\"",
    Teaching_Material: "Baiting offers something enticing—free downloads, gift cards, 'leaked payroll,' or even a physical USB drive—hoping curiosity does the rest. The classic physical example is a USB drop: a labeled drive left where employees will find it. Digital baiting includes 'useful tools,' cracked software, or too-good-to-be-true offers leading to malware or credential theft. The key point: baiting converts a security decision into a temptation decision. Defenses: don't plug in unknown devices, don't install unapproved software, and use approved channels for file sharing.",
    Activity_Prompt: "Scenario: \"You find a USB labeled 'Salary Adjustments'. What do you do?\" (Answer: hand to IT/security; do not plug in.)",
    References: "https://www.imperva.com/learn/application-security/social-engineering-attack/; https://www.cmu.edu/iso/aware/dont-take-the-bait/social-engineering.html; https://www.cmu.edu/iso/aware/be-aware/usb.html"
  },
  {
    Topic: "Tailgating (physical): \"the door-hold exploit\"",
    Teaching_Material: "Tailgating (piggybacking) is a physical social engineering attack where someone without access enters a restricted area by following an authorized person—often exploiting politeness (\"could you hold the door?\") or props (boxes, uniforms). Teach that it's not about being rude; it's about protecting people, devices, paperwork, and information inside the building. Good habits: don't badge strangers in, ask for credentials when appropriate, and use a friendly firm script: \"I can't let anyone in without a badge—reception/security will help you.\"",
    Activity_Prompt: "Role-play: Someone tries to enter behind you while \"on the phone carrying boxes.\" Practice the polite refusal + escort to reception.",
    References: "https://www.cmu.edu/iso/aware/dont-take-the-bait/social-engineering.html; https://www.cmu.edu/iso/news/2020/5-ways-to-outsmart-social-engineers.html?medium=mob; https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/tailgating-piggybacking-attack/"
  },
  {
    Topic: "Wrap-up checklist (Stop. Verify. Report.)",
    Teaching_Material: "1) Pause when you feel rushed or emotionally pushed. 2) Verify out-of-band: use known numbers/sites/apps; don't trust caller ID or embedded links. 3) Report early so your organization can protect others. Reinforce that verification is a skill, not a vibe: if the request is urgent, the safest response is to slow down.",
    Activity_Prompt: "Ask learners to write their own 1-sentence 'verification script' they'll actually use under pressure.",
    References: "https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/spoofing-and-phishing; https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/phishing; https://www.ic3.gov/PSA/2025/PSA250515; https://www.scripps.org/sparkle-assets/documents/avoiding_social_engineering_and_phishing_attacks_us-cert.pdf"
  }
];

// ============================================================================

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
  let content = row['Teaching_Material'] || row.Teaching_Material || '';
  
  // Add activity prompt if present
  const activityPrompt = row['Activity_Prompt'] || row.Activity_Prompt || '';
  if (activityPrompt && activityPrompt.trim() !== '') {
    content += `\n\n**Activity:** ${activityPrompt}`;
  }
  
  // Add references
  const references = row['References'] || row.References || '';
  if (references && references.trim() !== '') {
    content += formatReferences(references);
  }
  
  return content;
}

async function updateModule1Section1() {
  console.log('Starting update for Module 1 Section 1...');
  
  // Check if data is provided
  if (!csvData || csvData.length === 0) {
    console.error('ERROR: No data provided!');
    console.error('Please populate the csvData array at the top of this file with your CSV data.');
    console.error('You can use the helper script generate-embedded-data.js to convert your CSV to the required format.');
    process.exit(1);
  }
  
  // Initialize database
  await initDatabase();
  console.log('Database initialized successfully');
  
  const db = getDatabase();
  const results = csvData; // Use embedded data instead of reading from CSV
  
  console.log(`Processing ${results.length} rows of data`);
  
  return new Promise((resolve, reject) => {
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
          
          // Get the first row from data for Introduction and Key Concepts
          const firstRow = results[0];
          if (!firstRow || (!firstRow['Topic'] && !firstRow.Topic)) {
            console.error('Data does not contain expected format');
            console.error('First row:', firstRow);
            reject(new Error('Invalid data format - missing Topic field'));
            return;
          }
          
          const firstRowTopic = firstRow['Topic'] || firstRow.Topic;
          
          // Create Introduction page - welcome message based on first row concept
          const firstRowReferences = firstRow['References'] || firstRow.References || '';
          const introductionContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks (phishing, vishing, smishing, pretexting, baiting, tailgating)
• The psychological tactics attackers use
• How to recognize and respond to these threats safely

${formatReferences(firstRowReferences)}`;
          
          // Create Key Concepts page - use first row for core concept
          let keyConceptsContent = `## ${firstRowTopic}\n\n`;
          keyConceptsContent += formatContent(firstRow);
          
          // Add other topics from data as subsections
          if (results.length > 1) {
            keyConceptsContent += '\n\n## Types of Social Engineering Attacks\n\n';
            
            // Skip first row (already used) and process others
            for (let i = 1; i < results.length; i++) {
              const row = results[i];
              const topic = row['Topic'] || row.Topic;
              const teachingMaterial = row['Teaching_Material'] || row.Teaching_Material;
              
              if (topic && teachingMaterial) {
                keyConceptsContent += `### ${topic}\n\n`;
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
                // First, delete by screen_title (this handles both Introduction and Key Concepts)
                db.run('DELETE FROM learning_content WHERE section_id = ? AND (screen_title = ? OR screen_title = ?)', 
                  [sectionId, 'Introduction', 'Key Concepts'], 
                  (err) => {
                    if (err) {
                      console.error('Error deleting existing Introduction/Key Concepts:', err);
                      reject(err);
                      return;
                    }
                    
                    console.log('Deleted existing Introduction and Key Concepts');
                    
                    // Also delete by order_index as backup (in case screen_title changed)
                    db.run('DELETE FROM learning_content WHERE section_id = ? AND order_index IN (?, ?)', 
                      [sectionId, 1, 2], 
                      (err) => {
                        if (err) {
                          console.error('Error deleting by order_index:', err);
                          // Continue anyway - might not exist
                        }
                        
                        // Now insert the new content
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

