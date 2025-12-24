const { initDatabase, getDatabase } = require('../database/init');

/**
 * Script to ensure "Real-World Examples" page exists with images in production
 * Run this on Railway to verify/add the page
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
    const section = await new Promise((resolve, reject) => {
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

    if (!section) {
      console.error('❌ Section not found!');
      throw new Error('Section "Phishing and Social Engineering" not found in Module 1');
    }

    console.log(`✓ Found section: ${section.display_name} (ID: ${section.id})`);
    console.log('');

    // Check if "Real-World Examples" exists
    const existingPage = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, screen_title, order_index, content_markdown FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingPage) {
      console.log(`✓ "Real-World Examples" page exists (order_index: ${existingPage.order_index})`);
      
      // Check if it has images
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const images = [];
      let match;
      while ((match = imageRegex.exec(existingPage.content_markdown)) !== null) {
        images.push({ alt: match[1], path: match[2] });
      }
      
      console.log(`  Images found: ${images.length}`);
      if (images.length === 0) {
        console.log('  ⚠️ Page exists but has NO images - will update it');
      } else {
        console.log('  ✓ Page has images - all good!');
        console.log('\n✅ Nothing to do - page exists with images');
        return { success: true, action: 'exists' };
      }
    } else {
      console.log('❌ "Real-World Examples" page NOT FOUND - will create it');
    }

    // Content with images
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

    // Determine order_index (use 3 if page doesn't exist, or keep existing)
    const orderIndex = existingPage ? existingPage.order_index : 3;

    if (existingPage) {
      // Update existing page
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE learning_content SET content_markdown = ?, read_time_min = ? WHERE id = ?',
          [realWorldExamplesContent, 8, existingPage.id],
          function(err) {
            if (err) reject(err);
            else {
              console.log('✓ Updated "Real-World Examples" page with images');
              resolve();
            }
          }
        );
      });
    } else {
      // Insert new page
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
          [section.id, 'Real-World Examples', 8, realWorldExamplesContent, orderIndex],
          function(err) {
            if (err) reject(err);
            else {
              console.log('✓ Created "Real-World Examples" page with images');
              resolve();
            }
          }
        );
      });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ SUCCESS! "Real-World Examples" page now exists with images');
    console.log('='.repeat(80));
    console.log('');

    return { success: true, action: existingPage ? 'updated' : 'created' };
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error(error);
    throw error;
  }
}

// Export the function for use in server.js
module.exports = ensurePhishingExamples;

// If run directly (not imported), execute it
if (require.main === module) {
  ensurePhishingExamples()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

