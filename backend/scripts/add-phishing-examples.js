const { initDatabase, getDatabase } = require('../database/init');

/**
 * Script to add Real-World Examples page with phishing email screenshots
 * to Module 1, Section 1 (Phishing and Social Engineering)
 */

async function addPhishingExamples() {
  console.log('='.repeat(80));
  console.log('ADDING REAL-WORLD EXAMPLES TO MODULE 1, SECTION 1');
  console.log('='.repeat(80));
  console.log('');

  try {
    await initDatabase();
    const db = getDatabase();

    // Find Module 1, Section 1
    const findSectionQuery = `
      SELECT s.id, s.display_name, s.name, s.order_index, 
             m.id as module_id, m.display_name as module_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;

    const section = await new Promise((resolve, reject) => {
      db.get(findSectionQuery, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!section) {
      console.error('❌ Section not found!');
      console.log('Could not find Module 1, Section 1 (Phishing and Social Engineering)');
      process.exit(1);
    }

    console.log(`✓ Found section: ${section.module_name} - ${section.display_name}`);
    console.log(`  Section ID: ${section.id}`);
    console.log('');

    // Check existing content to determine order_index
    const existingContent = await new Promise((resolve, reject) => {
      db.all(
        'SELECT screen_title, order_index FROM learning_content WHERE section_id = ? ORDER BY order_index',
        [section.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    console.log(`Found ${existingContent.length} existing content item(s):`);
    existingContent.forEach(item => {
      console.log(`  - ${item.screen_title} (order: ${item.order_index})`);
    });
    console.log('');

    // Determine the order_index for the new content
    // Place it at order_index 3, right after "Understanding social engineering tactics" (order_index 2)
    // This way students see real examples early in their learning
    let targetOrderIndex = 3;
    const existingRealWorld = existingContent.find(item => item.screen_title === 'Real-World Examples');
    
    if (existingRealWorld) {
      // If it exists at a different position, we'll move it to position 3
      if (existingRealWorld.order_index !== 3) {
        console.log(`⚠ Real-World Examples exists at order_index ${existingRealWorld.order_index}`);
        console.log('  Will move it to order_index 3 (right after Key Concepts)...');
        targetOrderIndex = 3;
      } else {
        targetOrderIndex = 3;
        console.log(`✓ Real-World Examples already at order_index ${targetOrderIndex}`);
        console.log('  Will update existing content...');
      }
    } else {
      // Check if order_index 3 is taken
      const order3Taken = existingContent.find(item => item.order_index === 3);
      if (order3Taken) {
        console.log(`⚠ Order index 3 is taken by: ${order3Taken.screen_title}`);
        console.log('  Will need to shift content to make room...');
        // We'll delete the existing one and insert at 3, shifting others
        targetOrderIndex = 3;
      } else {
        console.log(`✓ Will insert at order_index ${targetOrderIndex}`);
      }
    }
    console.log('');

    // Create the Real-World Examples content
    const realWorldExamplesContent = `## Real-World Phishing Examples

Seeing actual phishing emails and websites can help you recognize these attacks in your own inbox. Below are three real-world examples with detailed explanations of the red flags.

### Example 1: BGS Security Quarantine Message

This phishing email attempts to trick you into thinking you have messages in quarantine that need attention.

![BGS Security email showing quarantine message](/phishing-examples/bgs-security-email.png)
*The phishing email: "You Have Messages In Quarantine"*

**Red Flags:**
- **Urgent language**: "You Have Messages" creates urgency
- **Suspicious sender**: The email may come from an unknown or spoofed address
- **Generic greeting**: Often lacks personalization
- **Call-to-action**: Urges immediate action without verification

![Fake BGS Security login page](/phishing-examples/bgs-security-website.png)
*The fake login page that appears after clicking the link*

**What happens if you click:**
- You're taken to a fake login page (enogp3wehr.pages.dev in this example)
- The page may look legitimate but is designed to steal your credentials
- Any credentials entered are captured by attackers

---

### Example 2: Office 365 Password Update

This attack impersonates Microsoft Office 365 and claims your password needs to be updated.

![Office 365 phishing email about password update](/phishing-examples/office365-email.png)
*The phishing email: "Operations Authentication / Office365 password update"*

**Red Flags:**
- **Authority impersonation**: Uses Microsoft/Office 365 branding to appear legitimate
- **Time pressure**: Suggests immediate action is required
- **Suspicious domain**: The link may point to a non-Microsoft domain
- **Grammar/formatting errors**: Professional companies rarely have these issues

![Fake Microsoft login page](/phishing-examples/office365-website.png)
*The spoofed Microsoft login page (plast.toys.up-plastic.com)*

**What happens if you click:**
- You're directed to a fake Microsoft login page
- The URL is clearly not from Microsoft (plast.toys.up-plastic.com)
- Entering credentials gives attackers access to your account

---

### Example 3: ShareFile Encrypted Message

This phishing attempt uses the name "ShareFile" (a legitimate file-sharing service) to trick you.

![ShareFile phishing email about encrypted message](/phishing-examples/sharefile-email.png)
*The phishing email: "Encrypted message / ACH transfer awaiting your review"*

**Red Flags:**
- **Business context**: Mentions "ACH transfer" to seem like a legitimate business email
- **Trusted service name**: Uses a well-known service name (ShareFile) to gain trust
- **Urgency**: "Awaiting your review" creates time pressure
- **Generic subject**: Lacks specific details about the supposed transaction

![Fake ShareFile login page](/phishing-examples/sharefile-website.png)
*The fake "Webmail Portal Access" login page (r2.dev)*

**What happens if you click:**
- You're taken to a fake login portal (r2.dev in this example)
- The page may claim to be for "Webmail Portal Access"
- Credentials entered here are stolen

---

## Key Takeaways

1. **Verify the sender**: Always check the sender's email address carefully
2. **Check URLs**: Hover over links (don't click!) to see the actual destination
3. **Look for urgency**: Legitimate emails rarely require immediate action
4. **When in doubt, verify**: Contact the organization through their official website or phone number
5. **Never share credentials**: Legitimate services will never ask you to verify your password via email

Remember: If an email seems suspicious, it probably is. When in doubt, don't click, and verify through a trusted channel.`;

    // If we need to move to position 3 and it's taken, shift content first
    if (targetOrderIndex === 3) {
      const order3Content = existingContent.find(item => item.order_index === 3 && item.screen_title !== 'Real-World Examples');
      if (order3Content) {
        console.log('  Shifting content from position 3 onwards to make room...');
        // Shift in reverse order to avoid unique constraint violations
        const contentToShift = existingContent.filter(item => item.order_index >= 3 && item.screen_title !== 'Real-World Examples')
          .sort((a, b) => b.order_index - a.order_index); // Sort descending
        
        for (const item of contentToShift) {
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE learning_content SET order_index = ? WHERE id = (SELECT id FROM learning_content WHERE section_id = ? AND screen_title = ? LIMIT 1)',
              [item.order_index + 1, section.id, item.screen_title],
              function(err) {
                if (err) {
                  console.error(`Error shifting ${item.screen_title}:`, err.message);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
        }
        console.log('✓ Shifted existing content to make room');
      }
    }

    // Delete existing Real-World Examples if it exists
    if (existingRealWorld) {
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM learning_content WHERE section_id = ? AND screen_title = ?',
          [section.id, 'Real-World Examples'],
          function(err) {
            if (err) reject(err);
            else {
              console.log('✓ Deleted existing Real-World Examples content');
              resolve();
            }
          }
        );
      });
    }

    // Insert the new content
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
        [section.id, 'Real-World Examples', 8, realWorldExamplesContent, targetOrderIndex],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              // If order_index conflict, try to find the next available
              console.error('Order index conflict. Attempting to resolve...');
              reject(err);
            } else {
              reject(err);
            }
          } else {
            console.log('✓ Successfully added Real-World Examples page');
            console.log(`  Order index: ${targetOrderIndex}`);
            console.log(`  Read time: 8 minutes`);
            resolve();
          }
        }
      );
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('SUCCESS! Real-World Examples page has been added.');
    console.log('='.repeat(80));
    console.log('');
    console.log('The page includes:');
    console.log('  - 3 real-world phishing email examples');
    console.log('  - Screenshots of phishing emails and fake login pages');
    console.log('  - Detailed explanations of red flags');
    console.log('  - Key takeaways for recognizing phishing attempts');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
addPhishingExamples()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

