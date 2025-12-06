# Railway Environment Variables Guide

## Required Environment Variables for Backend Deployment

This document lists all environment variables needed to deploy the backend to Railway.

---

## 🔴 **REQUIRED** Variables (Must Set)

### 1. **NODE_ENV**
```
NODE_ENV=production
```
**Purpose:** Sets the application environment  
**Why Required:** Determines CORS settings, error handling, and rate limiting behavior  
**Value:** Must be `production` for Railway deployment

---

### 2. **JWT_SECRET**
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
**Purpose:** Secret key for signing and verifying JWT tokens  
**Why Required:** Essential for authentication - users cannot log in without this  
**How to Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**⚠️ Security:** Use a long, random, secure string. Never commit this to git!

---

### 3. **PORT**
```
PORT=5000
```
**Purpose:** Port number for the server to listen on  
**Why Required:** Railway assigns a port dynamically  
**Note:** Railway automatically sets `PORT` environment variable, but you can override it  
**Default:** 5000 (if not set)

---

## 🟡 **RECOMMENDED** Variables (Should Set)

### 4. **FRONTEND_URL**
```
FRONTEND_URL=https://your-frontend-domain.com
```
**Purpose:** Frontend URL for email verification and password reset links  
**Why Recommended:** Email links won't work without this  
**Examples:**
- `https://sensebait.pro`
- `https://your-app.netlify.app`
- `https://your-domain.vercel.app`

---

### 5. **ALLOWED_ORIGINS** (Optional but Recommended)
```
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```
**Purpose:** Comma-separated list of allowed CORS origins  
**Why Recommended:** Better control over which domains can access your API  
**Default:** If not set, uses hardcoded defaults (see server.js)  
**Note:** Must include your frontend URL(s)

---

## 🟢 **OPTIONAL** Variables (Email Functionality)

These are optional but needed if you want email verification, password reset, etc.

### 6. **SMTP_HOST**
```
SMTP_HOST=smtp.gmail.com
```
**Purpose:** SMTP server hostname for sending emails  
**Default:** `smtp.gmail.com` (if not set)

**Common Providers:**
- Gmail: `smtp.gmail.com`
- Outlook: `smtp-mail.outlook.com`
- SendGrid: `smtp.sendgrid.net`
- Mailgun: `smtp.mailgun.org`

---

### 7. **SMTP_PORT**
```
SMTP_PORT=587
```
**Purpose:** SMTP server port  
**Default:** `587` (if not set)

**Common Ports:**
- `587` - TLS/STARTTLS (recommended)
- `465` - SSL
- `25` - Plain (not recommended)

---

### 8. **SMTP_SECURE**
```
SMTP_SECURE=false
```
**Purpose:** Whether to use SSL/TLS  
**Default:** `false` (uses STARTTLS)  
**Values:** 
- `true` - Use SSL (for port 465)
- `false` - Use STARTTLS (for port 587)

---

### 9. **SMTP_USER** (or EMAIL_USER)
```
SMTP_USER=your-email@gmail.com
```
**Purpose:** SMTP authentication username (usually your email)  
**Alternative:** `EMAIL_USER` (both work)

---

### 10. **SMTP_PASS** (or EMAIL_PASSWORD)
```
SMTP_PASS=your-app-specific-password
```
**Purpose:** SMTP authentication password  
**Alternative:** `EMAIL_PASSWORD` (both work)

**⚠️ Gmail Users:** You need to create an "App Password":
1. Enable 2-factor authentication
2. Go to Google Account → Security → App passwords
3. Generate a new app password
4. Use that password (not your regular password)

---

## 📋 Quick Setup Checklist

### Minimal Setup (No Email):
```
✅ NODE_ENV=production
✅ JWT_SECRET=<generate-random-string>
✅ PORT=5000 (usually auto-set by Railway)
✅ FRONTEND_URL=https://your-frontend.com
```

### Full Setup (With Email):
```
✅ NODE_ENV=production
✅ JWT_SECRET=<generate-random-string>
✅ PORT=5000
✅ FRONTEND_URL=https://your-frontend.com
✅ SMTP_HOST=smtp.gmail.com
✅ SMTP_PORT=587
✅ SMTP_SECURE=false
✅ SMTP_USER=your-email@gmail.com
✅ SMTP_PASS=your-app-password
```

---

## 🔧 How to Set Variables in Railway

### Method 1: Railway Dashboard
1. Go to your Railway project
2. Click on your backend service
3. Go to **Variables** tab
4. Click **New Variable**
5. Add each variable:
   - **Name:** e.g., `JWT_SECRET`
   - **Value:** e.g., `your-secret-value`
6. Click **Add**
7. Repeat for all variables

### Method 2: Railway CLI
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret
railway variables set FRONTEND_URL=https://your-frontend.com
```

### Method 3: Using Railway's .env File
Create a `.env` file in your project root (don't commit it):
```env
NODE_ENV=production
JWT_SECRET=your-secret
FRONTEND_URL=https://your-frontend.com
```

Then:
```bash
railway variables --file .env
```

---

## 🧪 Testing Your Variables

After setting variables, check Railway logs:
```bash
railway logs
```

Look for:
- ✅ `Environment: production` (should say production)
- ✅ `Server running on port XXXX`
- ✅ `Database initialized successfully`
- ⚠️ `No SMTP credentials found` (if emails aren't configured)

---

## 🔐 Security Best Practices

1. **Never commit secrets to git**
   - Use Railway's environment variables
   - Add `.env` to `.gitignore`

2. **Use strong JWT_SECRET**
   - Minimum 32 characters
   - Use random generator
   - Don't reuse across environments

3. **Rotate secrets regularly**
   - Change JWT_SECRET periodically
   - Change SMTP passwords if compromised

4. **Limit ALLOWED_ORIGINS**
   - Only include your frontend domains
   - Don't use wildcards in production

---

## 📝 Example Configuration

### For Gmail SMTP:
```env
NODE_ENV=production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
PORT=5000
FRONTEND_URL=https://sensebait.pro
ALLOWED_ORIGINS=https://sensebait.pro,https://www.sensebait.pro
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@sensebait.pro
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### For SendGrid SMTP:
```env
NODE_ENV=production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
FRONTEND_URL=https://sensebait.pro
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

---

## 🆘 Troubleshooting

### Issue: "JWT_SECRET is not defined"
**Solution:** Set `JWT_SECRET` environment variable in Railway

### Issue: CORS errors
**Solution:** 
- Set `ALLOWED_ORIGINS` with your frontend URL
- Or ensure `NODE_ENV=production` is set

### Issue: Emails not sending
**Solution:**
- Check SMTP credentials are set
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail, use App Password (not regular password)
- Check Railway logs for SMTP errors

### Issue: Database errors
**Solution:**
- SQLite database is created automatically
- Check Railway logs for database initialization errors
- Ensure Railway has write permissions

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] Server starts without errors
- [ ] `/api/health` endpoint returns `{"status":"OK"}`
- [ ] Frontend can make API calls (no CORS errors)
- [ ] User registration works
- [ ] User login works (requires JWT_SECRET)
- [ ] Email verification works (requires SMTP config)
- [ ] Password reset works (requires SMTP config)

---

**Need Help?** Check Railway logs: `railway logs`

