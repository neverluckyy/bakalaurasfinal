# Email Verification and Account Recovery Setup

## Overview

This document describes the email verification and account recovery features that have been implemented according to requirements R3.1-R3.4.

## Features Implemented

### R3.1: Email Verification on Registration ✅
- Users must verify their email address before their account is fully activated
- Verification email is sent automatically upon registration
- Users cannot log in until email is verified (R3.4)

### R3.2: Forgot Password Flow ✅
- Users can request a password reset via email
- Secure token-based password reset (expires in 1 hour)
- Password reset link sent to user's email

### R3.3: Email Change Verification ✅
- When changing email in profile settings, verification is required
- Verification email sent to new email address
- Notification email sent to old email address
- Email change only completes after verification

### R3.4: Unverified Email Protection ✅
- Users with unverified emails cannot log in
- Login returns error with option to resend verification email
- Prevents unverified email from being the only login identifier

## Email Configuration

### Required Environment Variables

Add these to your `backend/config.env` or Railway environment variables:

```env
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # SMTP username (usually your email)
SMTP_PASS=your-app-password       # SMTP password or app-specific password

# Alternative: You can also use EMAIL_USER and EMAIL_PASSWORD
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000  # Development
# FRONTEND_URL=https://sensebait.pro  # Production
```

### Contact Email

The contact email `info@sensebait.pro` is hardcoded in the email service as the sender address. This is used in:
- Email "From" field
- Support contact information in email templates

### Email Service Provider Setup

#### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

3. **Environment Variables:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

#### Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Database Schema Changes

The following columns have been added to the `users` table:

- `email_verified` (INTEGER, default 0) - Whether email is verified
- `email_verification_token` (TEXT) - Token for email verification
- `email_verification_expires` (DATETIME) - Expiration time for verification token
- `password_reset_token` (TEXT) - Token for password reset
- `password_reset_expires` (DATETIME) - Expiration time for reset token
- `new_email` (TEXT) - Pending new email address
- `new_email_verification_token` (TEXT) - Token for email change verification
- `new_email_verification_expires` (DATETIME) - Expiration time for email change token

These are automatically added when the database is initialized or when the server starts.

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - Register new user (sends verification email)
- `POST /api/auth/login` - Login (requires verified email)
- `GET /api/auth/verify-email?token=...` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Profile Endpoints

- `PUT /api/user/profile` - Update profile (requires email verification if email changed)
- `GET /api/user/verify-email-change?token=...` - Verify email change

## Frontend Pages

- `/verify-email` - Email verification page
- `/verify-email-change` - Email change verification page
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token

## User Flow

### Registration Flow
1. User registers with email and password
2. Verification email sent automatically
3. User clicks link in email → redirected to `/verify-email`
4. Email verified → user can now log in

### Login Flow
1. User attempts to log in
2. If email not verified → error message with "Resend Verification" button
3. If email verified → login successful

### Password Reset Flow
1. User clicks "Forgot Password" on login page
2. Enters email address
3. Receives password reset email (expires in 1 hour)
4. Clicks link → redirected to `/reset-password`
5. Enters new password
6. Password reset → redirected to login

### Email Change Flow
1. User changes email in Settings
2. Verification email sent to new email
3. Notification email sent to old email
4. User clicks verification link → email changed
5. Old email address no longer valid for login

## Testing Without Email Service

If SMTP credentials are not configured, the system will:
- Still create user accounts
- Log warnings about missing email configuration
- Return success responses (but emails won't be sent)

To test email functionality:
1. Set up SMTP credentials (see above)
2. Restart the backend server
3. Register a new account
4. Check your email inbox

## Security Features

- **Token Expiration:** Verification tokens expire after 24 hours
- **Password Reset Expiration:** Reset tokens expire after 1 hour
- **Secure Tokens:** All tokens are cryptographically secure random strings
- **Email Enumeration Protection:** Password reset always returns success (doesn't reveal if email exists)
- **Verified Email Required:** Users cannot log in with unverified emails

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials:**
   - Verify `SMTP_USER` and `SMTP_PASS` are correct
   - For Gmail, ensure you're using an App Password, not your regular password

2. **Check SMTP settings:**
   - Verify `SMTP_HOST` and `SMTP_PORT` are correct for your provider
   - Check `SMTP_SECURE` matches your port (false for 587, true for 465)

3. **Check server logs:**
   - Look for email service warnings in backend logs
   - Check for SMTP connection errors

4. **Test SMTP connection:**
   - Use a tool like `telnet` or `openssl` to test SMTP connection
   - Verify firewall/network allows SMTP connections

### Verification Links Not Working

1. **Check FRONTEND_URL:**
   - Ensure `FRONTEND_URL` environment variable is set correctly
   - Should match your frontend domain (e.g., `https://sensebait.pro`)

2. **Check token expiration:**
   - Verification tokens expire after 24 hours
   - Request a new verification email if expired

### Database Migration Issues

If you have an existing database:
- The new columns are automatically added when the server starts
- No manual migration needed
- Existing users will have `email_verified = 0` (unverified)

To verify existing users:
- They can use the "Resend Verification" feature
- Or manually set `email_verified = 1` in the database (not recommended for production)

## Production Checklist

- [ ] Configure SMTP credentials in production environment
- [ ] Set `FRONTEND_URL` to production domain (https://sensebait.pro)
- [ ] Test email sending in production
- [ ] Verify email templates display correctly
- [ ] Test all flows: registration, login, password reset, email change
- [ ] Monitor email delivery rates
- [ ] Set up email service monitoring/alerts
- [ ] Configure SPF/DKIM records for email domain (if using custom domain)

