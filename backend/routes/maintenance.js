const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

/**
 * Maintenance endpoint to apply database changes
 * This endpoint can be called to update learning content without shell access
 */
router.post('/apply-content-changes', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('Maintenance endpoint triggered: Applying content changes...');
    console.log('='.repeat(80));
    
    const { applyAllChanges } = require('../scripts/apply-all-changes-railway');
    
    // Run the script
    await applyAllChanges();
    
    console.log('✅ Content changes applied successfully via API');
    console.log('='.repeat(80));
    
    res.json({ 
      success: true, 
      message: 'Content changes applied successfully',
      timestamp: new Date().toISOString(),
      changes: [
        'Removed references from Introduction page',
        'Split Key Concepts into 8 separate pages (one concept per page)'
      ]
    });
  } catch (error) {
    console.error('❌ Failed to apply content changes:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to apply content changes',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Diagnostic endpoint to check current database state
 */
router.get('/check-content', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Find the section
    const sectionQuery = `
      SELECT s.id, s.display_name, m.display_name as module_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;
    
    db.get(sectionQuery, [], (err, section) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }
      
      // Get all learning content
      db.all(
        'SELECT id, screen_title, order_index, read_time_min, LENGTH(content_markdown) as content_length FROM learning_content WHERE section_id = ? ORDER BY order_index',
        [section.id],
        (err, content) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', message: err.message });
          }
          
          // Check Introduction for references
          const intro = content.find(c => c.screen_title === 'Introduction');
          const hasReferences = intro && intro.content_markdown && (
            intro.content_markdown.includes('References:') || 
            intro.content_markdown.includes('## References') ||
            intro.content_markdown.includes('formatReferences')
          );
          
          // Count concept pages (should be 8 separate ones)
          const conceptPages = content.filter(c => 
            c.screen_title !== 'Introduction' && 
            !c.screen_title.toLowerCase().includes('example') &&
            c.order_index > (intro ? intro.order_index : 0)
          );
          
          res.json({
            section: {
              id: section.id,
              name: section.display_name,
              module: section.module_name
            },
            introduction: {
              exists: !!intro,
              hasReferences: hasReferences,
              orderIndex: intro?.order_index,
              contentLength: intro?.content_length
            },
            conceptPages: {
              count: conceptPages.length,
              expected: 8,
              pages: conceptPages.map(c => ({
                title: c.screen_title,
                orderIndex: c.order_index
              }))
            },
            allContent: content.map(c => ({
              id: c.id,
              title: c.screen_title,
              orderIndex: c.order_index,
              readTime: c.read_time_min
            })),
            status: {
              needsUpdate: hasReferences || conceptPages.length !== 8,
              message: hasReferences 
                ? 'Introduction still has references' 
                : conceptPages.length !== 8 
                  ? `Expected 8 concept pages, found ${conceptPages.length}`
                  : 'Content is up to date'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      error: 'Diagnostic failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Endpoint to ensure phishing examples page exists with images
 * Call this endpoint to add/update the Real-World Examples page on Railway
 */
router.post('/ensure-phishing-examples', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('Maintenance endpoint: Ensuring phishing examples page exists...');
    console.log('='.repeat(80));
    
    // Import and run the ensure script
    const ensurePhishingExamples = require('../scripts/ensure-phishing-examples-on-railway');
    
    // The script exits, so we need to wrap it
    const db = require('../database/init').getDatabase();
    const { initDatabase } = require('../database/init');
    
    await initDatabase();
    
    // Find Module 1, Section 1
    const section = await new Promise((resolve, reject) => {
      const query = `
        SELECT s.id, s.display_name
        FROM sections s 
        JOIN modules m ON s.module_id = m.id 
        WHERE m.display_name = 'Security Awareness Essentials' 
        AND s.display_name = 'Phishing and Social Engineering'
        AND s.order_index = 1
      `;
      db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!section) {
      return res.status(404).json({ 
        success: false, 
        error: 'Section not found' 
      });
    }

    // Check if page exists
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

    const content = `## Real-World Phishing Examples

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

    const orderIndex = existingPage ? existingPage.order_index : 3;

    if (existingPage) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE learning_content SET content_markdown = ?, read_time_min = ? WHERE id = ?',
          [content, 8, existingPage.id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO learning_content (section_id, screen_title, read_time_min, content_markdown, order_index) VALUES (?, ?, ?, ?, ?)',
          [section.id, 'Real-World Examples', 8, content, orderIndex],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    console.log('✅ Phishing examples page ensured');
    console.log('='.repeat(80));

    res.json({ 
      success: true, 
      message: existingPage ? 'Phishing examples page updated' : 'Phishing examples page created',
      action: existingPage ? 'updated' : 'created',
      orderIndex: orderIndex,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to ensure phishing examples:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to ensure phishing examples page',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
