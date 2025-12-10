# 🔧 Fix Login 404 Error - Netlify + Railway Setup

## Problem
The login page shows a 404 error because API requests are going to `sensebait.pro/api/auth/login` (or your Netlify domain) instead of the Railway backend at `https://bakalaurasfinal-bak.up.railway.app/api/auth/login`.

## Solution: Set Environment Variable in Netlify

Since you're using Netlify for the frontend and Railway for the backend, you need to set the `VITE_API_URL` environment variable in Netlify.

### Step 1: Add Environment Variable in Netlify

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com
   - Click on your site (sensebait.pro or your Netlify site)

2. **Navigate to Environment Variables:**
   - Go to **Site settings** → **Environment variables**
   - Or: **Build & deploy** → **Environment** → **Environment variables**

3. **Add the Variable:**
   - Click **"Add a variable"** or **"Add environment variable"**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://bakalaurasfinal-bak.up.railway.app`
   - ⚠️ **Important:** 
     - Must include `https://`
     - No trailing slash
     - Use your actual Railway backend URL

4. **Save the variable**

### Step 2: Redeploy Your Site

Environment variables are only injected during the build process, so you need to trigger a new deployment:

1. **Go to Deploys tab** in Netlify
2. **Click "Trigger deploy"** → **"Deploy site"**
3. **Wait 2-3 minutes** for the build to complete

### Step 3: Verify It Works

1. **Test the backend is accessible:**
   - Open: `https://bakalaurasfinal-bak.up.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test login:**
   - Visit: `https://sensebait.pro/login` (or your Netlify domain)
   - Open browser console (F12) → **Network** tab
   - Try to log in
   - Check the API request URL - it should be: `https://bakalaurasfinal-bak.up.railway.app/api/auth/login`
   - Should NOT be: `sensebait.pro/api/auth/login` or `your-site.netlify.app/api/auth/login`

## Why This Works

The frontend code in `frontend/src/index.jsx` checks for the `VITE_API_URL` environment variable:

```javascript
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}
```

When this variable is set in Netlify:
- Vite injects it during the build process
- All API requests use this base URL
- Requests go directly to Railway backend
- No proxy needed!

## Troubleshooting

### Issue: Still getting 404 after redeploy

**Check:**
1. ✅ Environment variable name is exactly `VITE_API_URL` (case-sensitive)
2. ✅ Value includes `https://` prefix
3. ✅ No trailing slash in the URL
4. ✅ You triggered a new deploy after adding the variable
5. ✅ Backend is accessible at the Railway URL

**Solution:**
- Double-check the environment variable in Netlify dashboard
- Trigger another deploy
- Clear browser cache and try again

### Issue: CORS errors after fixing

**Solution:**
- Verify Railway backend has `NODE_ENV=production` set
- Check backend CORS allows your Netlify domain
- Backend should allow `*.netlify.app` domains (already configured in `backend/server.js`)

### Issue: Backend not accessible

**Solution:**
1. Check Railway dashboard → **Logs** for errors
2. Verify backend is running (not crashed)
3. Check Railway **Variables**:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `JWT_SECRET` is set

## Quick Checklist

- [ ] Added `VITE_API_URL` in Netlify environment variables
- [ ] Value is `https://bakalaurasfinal-bak.up.railway.app` (no trailing slash)
- [ ] Triggered a new deploy in Netlify
- [ ] Backend health check passes: `https://bakalaurasfinal-bak.up.railway.app/api/health`
- [ ] Tested login - API request goes to Railway backend
- [ ] Login works! ✅

## Alternative: Use Netlify Redirects (Not Recommended)

If for some reason you can't use environment variables, you could use Netlify redirects, but this is less reliable and doesn't work well with cookies/CORS. The environment variable approach is the recommended solution.

---

**Need help?** Check the Railway logs and Netlify build logs for any errors.

