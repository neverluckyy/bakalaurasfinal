const express = require('express');
const { CONTACT_EMAIL, getTransporter } = require('../utils/emailService');

const router = express.Router();

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Send email to support
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('Email transporter not available. Support contact form submission received but email not sent.');
      // Still return success to user, but log the issue
      return res.status(200).json({ 
        message: 'Your message has been received. We will get back to you soon.',
        note: 'Email service not configured - message logged only'
      });
    }

    const categoryLabels = {
      general: 'General Inquiry',
      technical: 'Technical Issue',
      account: 'Account Issue',
      feedback: 'Feedback',
      other: 'Other'
    };

    const mailOptions = {
      from: `"SenseBait Support" <${CONTACT_EMAIL}>`,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[Support] ${categoryLabels[category] || 'General'}: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #555; }
            .field-value { margin-top: 5px; color: #333; }
            .message-box { background-color: white; padding: 15px; border-left: 4px solid #4a90e2; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Support Request</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">Category:</div>
                <div class="field-value">${categoryLabels[category] || 'General'}</div>
              </div>
              <div class="field">
                <div class="field-label">Name:</div>
                <div class="field-value">${name}</div>
              </div>
              <div class="field">
                <div class="field-label">Email:</div>
                <div class="field-value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="field-label">Subject:</div>
                <div class="field-value">${subject}</div>
              </div>
              <div class="field">
                <div class="field-label">Message:</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from the SenseBait support contact form.</p>
              <p>Reply directly to this email to respond to the user.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Support Request
        
        Category: ${categoryLabels[category] || 'General'}
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
        
        ---
        This is an automated message from the SenseBait support contact form.
        Reply directly to this email to respond to the user.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Support contact form submitted by ${email}: ${subject}`);

    res.status(200).json({ 
      message: 'Your message has been received. We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Error sending support contact email:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again later or contact us directly at ' + CONTACT_EMAIL 
    });
  }
});

module.exports = router;






