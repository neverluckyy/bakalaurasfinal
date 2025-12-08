const { initDatabase, getDatabase } = require('../database/init');

/**
 * Apply all recent changes to Railway database:
 * 1. Remove references from Introduction page
 * 2. Split Key Concepts into separate pages (one concept per page)
 * 
 * Run this in Railway Shell: node scripts/apply-all-changes-railway.js
 */

function formatContent(row) {
  let content = '';
  
  if (row['Teaching_Material'] || row.Teaching_Material) {
    content += row['Teaching_Material'] || row.Teaching_Material;
  }
  
  if (row['Activity_Prompt'] || row.Activity_Prompt) {
    const activity = row['Activity_Prompt'] || row.Activity_Prompt;
    if (activity && activity.trim() !== '') {
      content += `\n\n**💡 Activity:** ${activity}`;
    }
  }
  
  if (row['References'] || row.References) {
    const refs = row['References'] || row.References;
    if (refs && refs.trim() !== '') {
      content += formatReferences(refs);
    }
  }
  
  return content;
}

function formatReferences(referencesStr) {
  if (!referencesStr || referencesStr.trim() === '') return '';
  
  const urls = referencesStr.split(';').map(url => url.trim()).filter(url => url);
  
  if (urls.length === 0) return '';
  
  const citationLinks = urls.map((url, index) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      return `${index + 1}. [${domain}](${url})`;
    } catch (e) {
      return `${index + 1}. ${url}`;
    }
  }).join('\n');
  
  return `\n\n## References\n\n${citationLinks}`;
}

async function applyAllChanges() {
  console.log('='.repeat(80));
  console.log('Applying All Changes to Railway Database');
  console.log('='.repeat(80));
  console.log('This will:');
  console.log('  1. Remove references from Introduction page');
  console.log('  2. Split Key Concepts into separate pages (one per concept)');
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

        // STEP 1: Remove references from Introduction
        console.log('STEP 1: Removing references from Introduction page...');
        db.get(
          'SELECT * FROM learning_content WHERE section_id = ? AND screen_title = ?',
          [sectionId, 'Introduction'],
          (err, introContent) => {
            if (err) {
              console.error('Error fetching Introduction:', err);
              reject(err);
              return;
            }

            if (!introContent) {
              console.warn('⚠️  Introduction not found, skipping...');
              proceedToStep2();
              return;
            }

            const newIntroContent = `Welcome to the **Phishing and Social Engineering** section!

This section will help you understand how attackers use psychological manipulation to trick people into revealing sensitive information or taking actions that compromise security.

You'll learn about:
• What social engineering is and how it works
• Different types of social engineering attacks (phishing, vishing, smishing, pretexting, baiting, tailgating)
• The psychological tactics attackers use
• How to recognize and respond to these threats safely`;

            db.run(
              'UPDATE learning_content SET content_markdown = ? WHERE section_id = ? AND screen_title = ?',
              [newIntroContent, sectionId, 'Introduction'],
              function(err) {
                if (err) {
                  console.error('Error updating Introduction:', err);
                  reject(err);
                  return;
                }

                console.log('✓ Removed references from Introduction page');
                console.log('');
                proceedToStep2();
              }
            );
          }
        );

        function proceedToStep2() {
          // STEP 2: Split Key Concepts
          console.log('STEP 2: Splitting Key Concepts into separate pages...');
          
          // Get all learning content
          db.all(
            'SELECT * FROM learning_content WHERE section_id = ? ORDER BY order_index',
            [sectionId],
            (err, allContent) => {
              if (err) {
                console.error('Error fetching content:', err);
                reject(err);
                return;
              }

              // Find Introduction
              const introduction = allContent.find(c => c.screen_title === 'Introduction');
              if (!introduction) {
                console.error('Introduction not found!');
                reject(new Error('Introduction not found'));
                return;
              }

              // Find all content that should be deleted (everything after Introduction that's not "Real World Examples")
              // This includes "Key Concepts" if it exists, and any other concept pages
              const conceptsToDelete = allContent.filter(c => 
                c.order_index > introduction.order_index && 
                c.screen_title !== 'Real World Examples' &&
                !c.screen_title.toLowerCase().includes('example') &&
                c.screen_title !== 'Introduction'
              );
              
              console.log('Content to delete:', conceptsToDelete.map(c => `${c.screen_title} (order: ${c.order_index})`));

              if (conceptsToDelete.length === 0) {
                console.log('No existing concept pages to delete');
              } else {
                console.log(`Found ${conceptsToDelete.length} existing concept pages to replace`);
              }

              // Concept data
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

              // Delete user progress for concepts to delete
              if (conceptsToDelete.length > 0) {
                const contentIds = conceptsToDelete.map(c => c.id);
                db.run(
                  `DELETE FROM user_learning_progress WHERE learning_content_id IN (${contentIds.map(() => '?').join(',')})`,
                  contentIds,
                  (err) => {
                    if (err) {
                      console.warn('Warning: Error deleting user progress:', err);
                    }
                    deleteAndInsert();
                  }
                );
              } else {
                deleteAndInsert();
              }

              function deleteAndInsert() {
                // Delete old concept pages by ID (more reliable than screen_title)
                if (conceptsToDelete.length > 0) {
                  const contentIds = conceptsToDelete.map(c => c.id);
                  console.log(`Deleting ${contentIds.length} content items by ID:`, contentIds);
                  
                  db.run(
                    `DELETE FROM learning_content WHERE id IN (${contentIds.map(() => '?').join(',')})`,
                    contentIds,
                    function(err) {
                      if (err) {
                        console.error('Error deleting concepts:', err);
                        reject(err);
                        return;
                      }
                      console.log(`✓ Deleted ${this.changes} old concept pages`);
                      insertConcepts();
                    }
                  );
                } else {
                  console.log('No existing concept pages to delete, proceeding with insertion');
                  insertConcepts();
                }
              }

              function insertConcepts() {
                console.log('');
                console.log('Inserting individual concept pages...');
                
                const nextOrderIndex = introduction.order_index + 1;
                let currentOrderIndex = nextOrderIndex;
                let insertCount = 0;

                function insertNextConcept(index) {
                  if (index >= csvData.length) {
                    console.log('');
                    console.log(`✓ Successfully created ${insertCount} separate concept pages`);
                    console.log('');
                    console.log('='.repeat(80));
                    console.log('✅ ALL CHANGES APPLIED SUCCESSFULLY!');
                    console.log('='.repeat(80));
                    console.log('');
                    console.log('Summary:');
                    console.log('  ✓ Removed references from Introduction page');
                    console.log(`  ✓ Created ${insertCount} separate concept pages`);
                    console.log('');
                    console.log('Your changes should now be visible on the website!');
                    console.log('='.repeat(80));
                    resolve();
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
                        console.error(`Error inserting concept "${topic}":`, err);
                        reject(err);
                        return;
                      }

                      insertCount++;
                      console.log(`  ✓ Created page ${insertCount}: "${topic}"`);
                      currentOrderIndex++;
                      
                      insertNextConcept(index + 1);
                    }
                  );
                }

                insertNextConcept(0);
              }
            }
          );
        }
      });
    });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  applyAllChanges()
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

module.exports = { applyAllChanges };

