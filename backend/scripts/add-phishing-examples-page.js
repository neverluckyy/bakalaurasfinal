const { initDatabase, getDatabase } = require('../database/init');

/**
 * Script to add a new "Phishing Examples" page with images and explanations
 * to Module 1, Section 1 (Phishing and Social Engineering)
 * This will be added as a new page at the end of the existing content
 */

async function addPhishingExamplesPage() {
  console.log('='.repeat(80));
  console.log('ADDING PHISHING EXAMPLES PAGE TO MODULE 1, SECTION 1');
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

    // Check existing content to find the highest order_index
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

    // Find the highest order_index
    const maxOrderIndex = existingContent.length > 0 
      ? Math.max(...existingContent.map(item => item.order_index))
      : 0;
    
    // Check if "Phishing Examples" already exists
    const existingPhishingExamples = existingContent.find(
      item => item.screen_title === 'Phishing Examples' || item.screen_title === 'Real-World Phishing Examples'
    );

    if (existingPhishingExamples) {
      console.log(`⚠ Found existing page: "${existingPhishingExamples.screen_title}" at order_index ${existingPhishingExamples.order_index}`);
      console.log('  Will update it with new content...');
    }

    // Determine the order_index for the new content (add after the last item)
    const targetOrderIndex = maxOrderIndex + 1;
    console.log(`✓ Will ${existingPhishingExamples ? 'update' : 'add'} at order_index ${targetOrderIndex}`);
    console.log('');

    // Create the Phishing Examples content with images and detailed explanations
    const phishingExamplesContent = `## Real-World Phishing Examples

Seeing actual phishing emails and websites can help you recognize these attacks in your own inbox. Below are three real-world examples with detailed explanations of the red flags.

### Example 1: BGS Security Quarantine Message

This phishing email attempts to trick you into thinking you have messages in quarantine that need attention.

![BGS Security email showing quarantine message](/phishing-examples/bgs-security-email.png)
*The phishing email: "You Have Messages In Quarantine"*

**Red Flags:**
- **Urgent language**: "You Have Messages" creates urgency to act quickly
- **Suspicious sender**: The email may come from an unknown or spoofed address
- **Generic greeting**: Often lacks personalization (no name, just generic message)
- **Call-to-action**: Urges immediate action without proper verification
- **Unusual domain**: The link may point to a suspicious domain

![Fake BGS Security login page](/phishing-examples/bgs-security-website.png)
*The fake login page that appears after clicking the link*

**What happens if you click:**
- You're taken to a fake login page (enogp3wehr.pages.dev in this example)
- The page may look legitimate but is designed to steal your credentials
- Any credentials entered are captured by attackers
- Your account could be compromised immediately

**How to protect yourself:**
- Never click links in suspicious emails
- Verify quarantine messages by logging into your email system directly
- Check the sender's email address carefully
- When in doubt, contact IT support through official channels

---

### Example 2: Office 365 Password Update

This attack impersonates Microsoft Office 365 and claims your password needs to be updated.

![Office 365 phishing email about password update](/phishing-examples/office365-email.png)
*The phishing email: "Operations Authentication / Office365 password update"*

**Red Flags:**
- **Authority impersonation**: Uses Microsoft/Office 365 branding to appear legitimate
- **Time pressure**: Suggests immediate action is required ("update now")
- **Suspicious domain**: The link may point to a non-Microsoft domain
- **Grammar/formatting errors**: Professional companies rarely have these issues
- **Generic subject line**: Lacks specific details about your account

![Fake Microsoft login page](/phishing-examples/office365-website.png)
*The spoofed Microsoft login page (plast.toys.up-plastic.com)*

**What happens if you click:**
- You're directed to a fake Microsoft login page
- The URL is clearly not from Microsoft (plast.toys.up-plastic.com)
- Entering credentials gives attackers access to your account
- They can access your emails, files, and other Microsoft services
- They may use your account to send more phishing emails

**How to protect yourself:**
- Microsoft will never ask you to update your password via email
- Always go directly to office.com or microsoft.com to manage your account
- Check the URL carefully before entering credentials
- Enable multi-factor authentication (MFA) for extra protection

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
- **Suspicious sender**: May come from an address that doesn't match the service

![Fake ShareFile login page](/phishing-examples/sharefile-website.png)
*The fake "Webmail Portal Access" login page (r2.dev)*

**What happens if you click:**
- You're taken to a fake login portal (r2.dev in this example)
- The page may claim to be for "Webmail Portal Access" or similar
- Credentials entered here are stolen
- Attackers can use your credentials to access other services
- Financial information may be at risk if ACH details are requested

**How to protect yourself:**
- Verify file-sharing requests through the official service website
- Never enter credentials on pages reached through email links
- Contact the sender through a separate, verified channel
- Be suspicious of urgent financial transaction requests via email

---

## Key Takeaways

1. **Verify the sender**: Always check the sender's email address carefully - look for misspellings or unusual domains

2. **Check URLs**: Hover over links (don't click!) to see the actual destination before clicking

3. **Look for urgency**: Legitimate emails rarely require immediate action - be suspicious of time pressure

4. **When in doubt, verify**: Contact the organization through their official website or phone number (not from the email)

5. **Never share credentials**: Legitimate services will never ask you to verify your password via email

6. **Examine the domain**: Check if the URL matches the organization's official website

7. **Watch for spelling/grammar**: Professional companies rarely have significant errors in official communications

8. **Trust your instincts**: If an email seems suspicious, it probably is

Remember: If an email seems suspicious, it probably is. When in doubt, don't click, and verify through a trusted channel. Report suspicious emails to your IT department or use your email provider's phishing reporting feature.`;

    // Delete existing "Phishing Examples" or "Real-World Phishing Examples" if it exists
    if (existingPhishingExamples) {
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM learning_content WHERE section_id = ? AND screen_title = ?',
          [section.id, existingPhishingExamples.screen_title],
          function(err) {
            if (err) reject(err);
            else {
              console.log(`✓ Deleted existing "${existingPhishingExamples.screen_title}" content`);
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
        [section.id, 'Phishing Examples', 10, phishingExamplesContent, targetOrderIndex],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              console.error('Order index conflict. Attempting to resolve...');
              reject(err);
            } else {
              reject(err);
            }
          } else {
            console.log('✓ Successfully added Phishing Examples page');
            console.log(`  Order index: ${targetOrderIndex}`);
            console.log(`  Read time: 10 minutes`);
            resolve();
          }
        }
      );
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('SUCCESS! Phishing Examples page has been added.');
    console.log('='.repeat(80));
    console.log('');
    console.log('The page includes:');
    console.log('  - 3 real-world phishing email examples');
    console.log('  - Screenshots of phishing emails and fake login pages');
    console.log('  - Detailed explanations of red flags for each example');
    console.log('  - "What happens if you click" sections');
    console.log('  - "How to protect yourself" guidance');
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
addPhishingExamplesPage()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

