# 🔧 Fix Login 404 Error

## Problem
The login page is showing a 404 error because API requests are going to `sensebait.pro/api/auth/login` instead of the Railway backend at `https://bakalaurasfinal-bak.up.railway.app/api/auth/login`.

## Solution 1: Rebuild Frontend with Environment Variable (Recommended)

This is the most reliable solution that will work regardless of your hosting provider.

### Steps:

1. **Create or update `frontend/.env` file:**
   ```env
   VITE_API_URL=https://bakalaurasfinal-bak.up.railway.app
   ```
   ⚠️ **Important:** No trailing slash!

2. **Rebuild the frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Upload the new build:**
   - Upload all files from `frontend/dist` to your Hostinger `public_html` directory
   - Replace all existing files

4. **Test:**
   - Visit `https://sensebait.pro/login`
   - Try logging in
   - Check browser console (F12) → Network tab
   - The API request should now go to: `https://bakalaurasfinal-bak.up.railway.app/api/auth/login`

---

## Solution 2: Apache Proxy Rule (If mod_proxy is enabled)

I've already updated your `.htaccess` file with a proxy rule. However, this requires `mod_proxy` to be enabled on your Hostinger server.

### To test if it works:

1. **Upload the updated `.htaccess` file** to your Hostinger `public_html` directory

2. **Test the login:**
   - Visit `https://sensebait.pro/login`
   - Try logging in
   - If it works → mod_proxy is enabled ✅
   - If you still get 404 → mod_proxy is not enabled ❌

3. **If mod_proxy is not enabled:**
   - You'll need to use **Solution 1** (rebuild with environment variable)
   - Or contact Hostinger support to enable mod_proxy (they may not allow this)

---

## Verify Backend is Accessible

Before testing login, verify your backend is running:

1. **Test backend health endpoint:**
   - Open: `https://bakalaurasfinal-bak.up.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **If backend is not accessible:**
   - Check Railway dashboard → **Logs** for errors
   - Verify backend is running (not crashed)
   - Check Railway **Variables** - ensure `NODE_ENV=production` is set

---

## Quick Fix Summary

**Fastest solution:**
1. Create `frontend/.env` with: `VITE_API_URL=https://bakalaurasfinal-bak.up.railway.app`
2. Run `cd frontend && npm run build`
3. Upload `frontend/dist/*` to Hostinger `public_html`
4. Test login

**Alternative (if mod_proxy works):**
1. Upload updated `.htaccess` to Hostinger
2. Test login (should work immediately)

---

## Why This Happened

The frontend code checks for `VITE_API_URL` environment variable in production. If it's not set, it defaults to an empty string (relative URL), causing requests to go to `sensebait.pro/api/*` instead of the Railway backend.

The fix ensures the frontend knows where to send API requests.

