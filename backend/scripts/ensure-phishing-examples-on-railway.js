const { initDatabase, getDatabase } = require('../database/init');

/**
 * Script to ensure the "Real-World Examples" page exists in Module 1, Section 1
 * This script runs on server startup and ensures the page is always present
 * with the latest content.
 */
async function ensurePhishingExamples() {
  console.log('='.repeat(80));
  console.log('ENSURING PHISHING EXAMPLES PAGE EXISTS');
  console.log('='.repeat(80));
  console.log('');

  try {
    await initDatabase();
    const db = getDatabase();

    // Find Module 1, Section 1
    // Try with order_index first, then without if not found
    let section = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.id, s.display_name
        FROM sections s 
        JOIN modules m ON s.module_id = m.id 
        WHERE m.display_name = 'Security Awareness Essentials' 
        AND s.display_name = 'Phishing and Social Engineering'
        AND s.order_index = 1
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // If not found with order_index, try without it
    if (!section) {
      section = await new Promise((resolve, reject) => {
        db.get(`
          SELECT s.id, s.display_name
          FROM sections s 
          JOIN modules m ON s.module_id = m.id 
          WHERE m.display_name = 'Security Awareness Essentials' 
          AND s.display_name = 'Phishing and Social Engineering'
        `, [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    if (!section) {
      throw new Error('Section not found: Module 1, Section 1 (Phishing and Social Engineering)');
    }

    console.log(`✓ Found section: ${section.display_name} (ID: ${section.id})`);
    console.log('');

    // Check if the page already exists
    const existingPage = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, screen_title, order_index, content_markdown FROM learning_content WHERE section_id = ? AND (screen_title = ? OR screen_title = ?)',
        [section.id, 'Real-World Examples', 'Phishing Examples'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Content with images
    const realWorldExamplesContent = ` Real-World Phishing Examples

Seeing actual phishing emails and websites can help you recognize these attacks in your own inbox. Below are three real-world examples with detailed explanations of what the attackers are trying to do, the tactics they use, and the red flags to watch for.

Example 1: BGS Security Quarantine Message

What this phishing attack is trying to do:
This attack attempts to steal your email or security credentials by tricking you into believing you have important messages waiting in quarantine. The attacker wants you to click the link and enter your login credentials on a fake website.

Tactics used:
- Authority impersonation: Poses as a security service (BGS Security) to appear legitimate
- Urgency manipulation: Creates fear that you're missing important messages
- Curiosity exploitation: Makes you want to see what messages are "waiting"
- Trust exploitation: Uses security-related language to make the request seem necessary

![BGS Security email showing quarantine message](/phishing-examples/bgs-security-email.png)

The phishing email: "You Have Messages In Quarantine"

Red flags to look out for:
- Urgent language: "You Have Messages" creates artificial urgency to bypass your critical thinking
- Suspicious sender address: The email may come from an unknown or spoofed address that doesn't match the claimed organization
- Generic greeting: Often lacks personalization (no name, account number, or specific details)
- Immediate action required: Urges you to click without giving you time to verify
- Unfamiliar service: You may not recognize "BGS Security" or remember signing up for their service

![Fake BGS Security login page](/phishing-examples/bgs-security-website.png)

The fake login page that appears after clicking the link

What happens if you click:
- You're taken to a fake login page (enogp3wehr.pages.dev in this example - clearly not a legitimate security service domain)
- The page may look professional but is designed solely to steal your credentials
- Any username and password you enter are immediately captured by attackers
- Attackers can then access your accounts, send phishing emails to your contacts, or steal sensitive information


Example 2: Office 365 Password Update

What this phishing attack is trying to do:
This attack aims to steal your Microsoft Office 365 or Microsoft account credentials by impersonating Microsoft and claiming your password needs to be updated. Once attackers have your credentials, they can access your email, documents, and other Microsoft services.

Tactics used:
- Brand impersonation: Uses Microsoft/Office 365 branding and logos to appear official
- Authority exploitation: Leverages trust in a well-known company (Microsoft)
- Fear of account lockout: Suggests your account will be locked if you don't act
- Time pressure: Creates urgency to prevent you from verifying the request
- Professional appearance: Mimics Microsoft's email design to look authentic

![Office 365 phishing email about password update](/phishing-examples/office365-email.png)

The phishing email: "Operations Authentication / Office365 password update"

Red flags to look out for:
- Suspicious sender domain: The "from" address may not be from @microsoft.com or @office365.com
- Urgent time pressure: Suggests immediate action is required without explanation
- Suspicious link destination: Hovering over the link reveals it points to a non-Microsoft domain (plast.toys.up-plastic.com in this example)
- Grammar or formatting errors: Professional companies like Microsoft rarely have spelling mistakes or awkward phrasing
- Unusual subject line: "Operations Authentication" is not typical Microsoft terminology
- No account-specific details: Legitimate Microsoft emails usually reference your account name or email address

![Fake Microsoft login page](/phishing-examples/office365-website.png)

The spoofed Microsoft login page (plast.toys.up-plastic.com)

What happens if you click:
- You're directed to a fake Microsoft login page that looks nearly identical to the real one
- The URL clearly shows it's not from Microsoft (plast.toys.up-plastic.com is a random domain, not microsoft.com)
- Entering your credentials gives attackers full access to your Microsoft account
- Attackers can read your emails, access your OneDrive files, send emails as you, and potentially reset passwords for other accounts linked to your email


Example 3: ShareFile Encrypted Message

What this phishing attack is trying to do:
This attack attempts to steal your credentials by impersonating ShareFile (a legitimate file-sharing service). The attacker wants you to believe you have an important business document or financial transaction waiting, creating urgency to log in and view it.

Tactics used:
- Service name spoofing: Uses the name of a legitimate, well-known service (ShareFile) to gain trust
- Business context manipulation: Mentions "ACH transfer" (a real banking term) to make it seem like a legitimate business communication
- Financial urgency: Creates concern about a pending transaction that needs your attention
- Trust exploitation: Leverages familiarity with ShareFile to lower your guard
- Curiosity exploitation: Makes you want to see what the "encrypted message" contains

![ShareFile phishing email about encrypted message](/phishing-examples/sharefile-email.png)

The phishing email: "Encrypted message / ACH transfer awaiting your review"

Red flags to look out for:
- Vague business context: Mentions "ACH transfer" but lacks specific details (amount, sender, transaction ID, account numbers)
- Generic subject line: "Encrypted message" is too vague - legitimate business emails are more specific
- Urgency without explanation: "Awaiting your review" creates time pressure but doesn't explain why
- Unfamiliar sender: You may not recognize the sender's email address or remember doing business with them
- Suspicious link: The link may not point to sharefile.com or the legitimate ShareFile domain
- No prior context: Legitimate business communications usually reference previous conversations or transactions

![Fake ShareFile login page](/phishing-examples/sharefile-website.png)

The fake "Webmail Portal Access" login page (r2.dev)

What happens if you click:
- You're taken to a fake login portal (r2.dev in this example - not sharefile.com)
- The page may claim to be for "Webmail Portal Access" or use ShareFile branding
- Any credentials you enter are stolen by attackers
- Attackers can then access your ShareFile account (if you have one) or use your credentials to try logging into other services
- If you reuse passwords, attackers may gain access to multiple accounts


Key Takeaways

1. Verify the sender: Always check the sender's email address carefully - legitimate companies use their official domains
2. Check URLs before clicking: Hover over links (don't click!) to see the actual destination - if it doesn't match the claimed organization, it's fake
3. Look for urgency tactics: Legitimate emails rarely require immediate action - be suspicious of time pressure
4. Watch for generic content: Real business emails include specific details (account numbers, transaction IDs, names) - vague messages are often phishing
5. When in doubt, verify independently: Contact the organization through their official website or phone number (not the contact info in the email)
6. Never share credentials via email links: Legitimate services will never ask you to verify your password via an email link

Remember: If an email seems suspicious, it probably is. When in doubt, don't click, and verify through a trusted channel you initiate yourself.`;

    // Determine order_index - place at position 9 (after 7 concepts, before the 8th concept)
    let orderIndex = 9;
    
    if (existingPage) {
      // If page exists but not at position 9, we need to move it
      if (existingPage.order_index !== 9) {
        console.log(`⚠️  Page exists at position ${existingPage.order_index}, moving to position 9`);
        
        // Shift other pages to make room
        if (existingPage.order_index < 9) {
          // Move pages between current position and 9 down by 1
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE learning_content SET order_index = order_index + 1 WHERE section_id = ? AND order_index >= ? AND order_index < 9 AND id != ?',
              [section.id, existingPage.order_index + 1, existingPage.id],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        } else {
          // Move pages between 9 and current position up by 1
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE learning_content SET order_index = order_index - 1 WHERE section_id = ? AND order_index > 9 AND order_index < ? AND id != ?',
              [section.id, existingPage.order_index, existingPage.id],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        
        // Update the page's order_index
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE learning_content SET order_index = ? WHERE id = ?',
            [9, existingPage.id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      
      // Always update the content to ensure it's current
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE learning_content SET content_markdown = ? WHERE id = ?',
          [realWorldExamplesContent, existingPage.id],
          function(err) {
            if (err) reject(err);
            else {
              console.log(`✓ Updated existing "Real-World Examples" page at position ${existingPage.order_index === 9 ? 9 : '9 (moved)'}`);
              resolve();
            }
          }
        );
      });
      
      console.log('');
      console.log('='.repeat(80));
      console.log('SUCCESS! Real-World Examples page updated.');
      console.log('='.repeat(80));
      console.log('');
      
      return { success: true, action: 'updated' };
    } else {
      // Page doesn't exist, create it
      console.log('Creating new "Real-World Examples" page at position 9...');
      
      // Check if position 9 is already taken
      const pageAt9 = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM learning_content WHERE section_id = ? AND order_index = ?',
          [section.id, 9],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (pageAt9) {
        // Shift pages at position 9 and above up by 1
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE learning_content SET order_index = order_index + 1 WHERE section_id = ? AND order_index >= 9',
            [section.id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      
      // Insert the new page
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
          [section.id, 'Real-World Examples', 8, realWorldExamplesContent, orderIndex],
          function(err) {
            if (err) reject(err);
            else {
              console.log(`✓ Created new "Real-World Examples" page at position ${orderIndex}`);
              resolve();
            }
          }
        );
      });
      
      console.log('');
      console.log('='.repeat(80));
      console.log('SUCCESS! Real-World Examples page created.');
      console.log('='.repeat(80));
      console.log('');
      
      return { success: true, action: 'created' };
    }

  } catch (error) {
    console.error('');
    console.error('❌ Error ensuring phishing examples:', error.message);
    console.error(error);
    throw error; // Re-throw so caller can handle it
  }
}

module.exports = ensurePhishingExamples;
