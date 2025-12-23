const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration
// In production, these should be set via environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
  }
};

// Contact email for support
const CONTACT_EMAIL = 'info@sensebait.pro';

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // If no SMTP credentials are provided, create a test account (for development)
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  No SMTP credentials found. Email sending will be disabled.');
      console.warn('⚠️  Set SMTP_USER and SMTP_PASS environment variables to enable email sending.');
      return null;
    }
    
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth
    });
  }
  return transporter;
}

// Generate a secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send email verification email
async function sendVerificationEmail(email, token, displayName) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email transporter not available. Skipping verification email.');
    return { success: false, error: 'Email service not configured' };
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"SenseBait" <${CONTACT_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email Address - SenseBait',
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
          .button { display: inline-block; padding: 12px 30px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SenseBait!</h1>
          </div>
          <div class="content">
            <p>Hi ${displayName || 'there'},</p>
            <p>Thank you for registering with SenseBait! Please verify your email address to activate your account.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4a90e2;">${verificationUrl}</p>
            <p>This link will expire in 5 days.</p>
            <p>If you didn't create an account with SenseBait, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at ${CONTACT_EMAIL}</p>
            <p>&copy; ${new Date().getFullYear()} SenseBait. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to SenseBait!
      
      Hi ${displayName || 'there'},
      
      Thank you for registering with SenseBait! Please verify your email address to activate your account.
      
      Click this link to verify your email:
      ${verificationUrl}
      
      This link will expire in 5 days.
      
      If you didn't create an account with SenseBait, please ignore this email.
      
      If you have any questions, please contact us at ${CONTACT_EMAIL}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

// Send password reset email
async function sendPasswordResetEmail(email, token, displayName) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email transporter not available. Skipping password reset email.');
    return { success: false, error: 'Email service not configured' };
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"SenseBait" <${CONTACT_EMAIL}>`,
    to: email,
    subject: 'Reset Your Password - SenseBait',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${displayName || 'there'},</p>
            <p>We received a request to reset your password for your SenseBait account.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #e74c3c;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at ${CONTACT_EMAIL}</p>
            <p>&copy; ${new Date().getFullYear()} SenseBait. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${displayName || 'there'},
      
      We received a request to reset your password for your SenseBait account.
      
      Click this link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      ⚠️ Security Notice: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      
      If you have any questions, please contact us at ${CONTACT_EMAIL}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

// Send email change verification email (to new email)
async function sendEmailChangeVerificationEmail(newEmail, token, displayName) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email transporter not available. Skipping email change verification email.');
    return { success: false, error: 'Email service not configured' };
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-change?token=${token}`;

  const mailOptions = {
    from: `"SenseBait" <${CONTACT_EMAIL}>`,
    to: newEmail,
    subject: 'Verify Your New Email Address - SenseBait',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Change Verification</h1>
          </div>
          <div class="content">
            <p>Hi ${displayName || 'there'},</p>
            <p>You requested to change your email address for your SenseBait account to this email address.</p>
            <p>Please verify this new email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify New Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #27ae60;">${verificationUrl}</p>
            <p>This link will expire in 5 days.</p>
            <p>If you didn't request this email change, please ignore this email and contact us at ${CONTACT_EMAIL}.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at ${CONTACT_EMAIL}</p>
            <p>&copy; ${new Date().getFullYear()} SenseBait. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Email Change Verification
      
      Hi ${displayName || 'there'},
      
      You requested to change your email address for your SenseBait account to this email address.
      
      Please verify this new email address by clicking this link:
      ${verificationUrl}
      
      This link will expire in 5 days.
      
      If you didn't request this email change, please ignore this email and contact us at ${CONTACT_EMAIL}.
      
      If you have any questions, please contact us at ${CONTACT_EMAIL}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email change verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email change verification email:', error);
    return { success: false, error: error.message };
  }
}

// Send email change notification (to old email)
async function sendEmailChangeNotification(oldEmail, newEmail, displayName) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email transporter not available. Skipping email change notification.');
    return { success: false, error: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"SenseBait" <${CONTACT_EMAIL}>`,
    to: oldEmail,
    subject: 'Email Address Change Request - SenseBait',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Address Change Request</h1>
          </div>
          <div class="content">
            <p>Hi ${displayName || 'there'},</p>
            <p>We received a request to change the email address for your SenseBait account.</p>
            <p><strong>Current email:</strong> ${oldEmail}</p>
            <p><strong>New email:</strong> ${newEmail}</p>
            <p>A verification email has been sent to the new email address. The email change will only be completed after verification.</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this email change, please contact us immediately at ${CONTACT_EMAIL} to secure your account.
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at ${CONTACT_EMAIL}</p>
            <p>&copy; ${new Date().getFullYear()} SenseBait. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Email Address Change Request
      
      Hi ${displayName || 'there'},
      
      We received a request to change the email address for your SenseBait account.
      
      Current email: ${oldEmail}
      New email: ${newEmail}
      
      A verification email has been sent to the new email address. The email change will only be completed after verification.
      
      ⚠️ Security Notice: If you didn't request this email change, please contact us immediately at ${CONTACT_EMAIL} to secure your account.
      
      If you have any questions, please contact us at ${CONTACT_EMAIL}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email change notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email change notification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerificationEmail,
  sendEmailChangeNotification,
  CONTACT_EMAIL
};

