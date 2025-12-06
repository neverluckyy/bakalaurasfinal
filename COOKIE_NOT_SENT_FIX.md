# 🔧 Cookie Not Being Sent - Fix Guide

## Problem
Login works, but cookie isn't being sent with subsequent requests, causing 401 errors.

## Root Cause
Cross-domain cookies require specific settings, and the browser might be blocking them.

## Solution: Verify NODE_ENV

The cookie settings depend on `NODE_ENV=production`. If it's not set, cookies won't work correctly.

### Step 1: Check Railway Variables

1. **Go to Railway Dashboard → Your Project → Variables**
2. **Verify `NODE_ENV=production` is set**
3. **If not set or wrong:**
   - Add/Update:
     - **Key**: `NODE_ENV`
     - **Value**: `production`
4. **Redeploy** (Railway will auto-redeploy when you save)

### Step 2: Test Cookie After Login

After logging in, test if cookie is set:

**Open browser console (F12) and run:**
```javascript
// This won't show httpOnly cookies, but helps verify
fetch('https://bakalaurasfinal-bak.up.railway.app/api/auth/me', {
  credentials: 'include'
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Response headers:', [...r.headers.entries()]);
  return r.json();
})
.then(d => console.log('Result:', d));
```

**Expected:**
- If cookie is sent: Status 200, user data returned
- If cookie not sent: Status 401, "Access token required"

### Step 3: Check Browser Cookie Settings

Some browsers block third-party cookies by default:

1. **Chrome:**
   - Settings → Privacy and security → Third-party cookies
   - Enable "Allow third-party cookies" (or use "Allow all cookies" for testing)

2. **Firefox:**
   - Settings → Privacy & Security
   - Under "Cookies and Site Data", allow third-party cookies

3. **Safari:**
   - Preferences → Privacy
   - Uncheck "Prevent cross-site tracking"

### Step 4: Check Railway Logs

After setting NODE_ENV and redeploying:

1. **Log in again**
2. **Check Railway logs** for:
   - "Setting cookie with options:" - Should show `secure: true, sameSite: 'none'`
   - "Auth check - Token present: true" - When accessing modules

### Step 5: Alternative - Use Local Storage (If Cookies Don't Work)

If cookies still don't work due to browser restrictions, we can modify the frontend to use localStorage and send token in headers instead. But let's try fixing cookies first.

## Quick Test

1. **Set NODE_ENV=production in Railway**
2. **Redeploy backend**
3. **Clear all cookies**
4. **Log in again**
5. **Check Railway logs** - should see cookie being set with correct options
6. **Try accessing modules** - should work

## Most Likely Fix

**NODE_ENV is not set to 'production'**, so cookies are being set with:
- `secure: false` (won't work on HTTPS)
- `sameSite: 'lax'` (won't work cross-domain)

**Fix:** Set `NODE_ENV=production` in Railway Variables.

