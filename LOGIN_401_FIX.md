# 🔧 Login 401 Error - Troubleshooting

## Problem
Getting 401 "Invalid credentials" even with valid credentials after cookie changes.

## Possible Causes

1. **Backend not redeployed** with new cookie settings
2. **Password hash mismatch** (user created before/after password hashing changes)
3. **Database issue** (user not found or password hash corrupted)
4. **Cookie settings too restrictive** (cookies not being set)

## Step-by-Step Fix

### Step 1: Verify Backend is Redeployed

1. **Check Railway Dashboard:**
   - Go to Railway → Your Project → Deployments
   - Verify latest deployment is successful (green)
   - Check deployment time - should be recent (after cookie changes)

2. **If not redeployed:**
   ```bash
   git add backend/routes/auth.js
   git commit -m "Fix cookie settings for cross-domain"
   git push
   ```
   Wait 2-3 minutes for Railway to deploy.

### Step 2: Clear Browser Data

The old cookies might be interfering:

1. **Open browser console (F12)**
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Clear cookies:**
   - Find `bakalaurasfinal-bak.up.railway.app`
   - Delete all cookies
   - Also clear cookies for `beamish-granita-b7abb8.netlify.app`

4. **Or use Incognito/Private window** for testing

### Step 3: Test Login Directly

Test the login endpoint directly to see the actual error:

**Open browser console (F12) and run:**
```javascript
fetch('https://bakalaurasfinal-bak.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'your-email@example.com',
    password: 'your-password'
  })
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('Response:', data);
  console.log('Cookies set?', document.cookie);
})
.catch(err => console.error('Error:', err));
```

**Check the response:**
- `401` with `"Invalid credentials"` = Password/user issue
- `200` with user data = Login works, cookie issue
- `500` = Server error

### Step 4: Check if User Exists

The user might not exist or password might be wrong:

1. **Try registering a NEW account:**
   - Go to registration page
   - Create a new account with a different email
   - Try logging in with that account

2. **If new account works:**
   - Old account might have password hash issue
   - Delete old account and recreate it

### Step 5: Check Railway Logs

1. **Go to Railway Dashboard → Your Project → Logs**
2. **Try to log in**
3. **Check logs for:**
   - "Database query error in login"
   - "Invalid credentials" messages
   - Any error messages

### Step 6: Verify NODE_ENV is Set

The cookie settings depend on `NODE_ENV=production`:

1. **Railway Dashboard → Your Project → Variables**
2. **Verify `NODE_ENV=production` is set**
3. **If not set, add it:**
   - Key: `NODE_ENV`
   - Value: `production`

## Quick Fix: Try Registration Instead

If login isn't working, try:

1. **Register a new account** (this will work with new cookie settings)
2. **Log in with the new account**
3. **This confirms cookie settings work**

## Alternative: Temporarily Relax Cookie Settings

If the issue persists, we can temporarily use less restrictive settings for testing:

```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // Always true for HTTPS
  sameSite: 'none', // Required for cross-domain
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});
```

## Most Likely Issue

**Backend not redeployed yet** or **old cookies interfering**.

**Fix:**
1. Deploy the cookie changes
2. Clear browser cookies
3. Try logging in again
4. Or register a new account

