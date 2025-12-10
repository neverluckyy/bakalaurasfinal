# ✅ Verify Environment Variable Setup

## Quick Checklist

1. **Click the eye icon** 👁️ next to `REACT_APP_API_URL` to reveal the value
2. **Verify the URL format:**
   - ✅ Should be: `https://your-app-name.railway.app`
   - ❌ Should NOT be: `https://your-app-name.railway.app/` (no trailing slash)
   - ❌ Should NOT be: `http://your-app-name.railway.app` (must be https)

3. **Test your Railway backend:**
   - Open: `https://your-backend-url.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`
   - If you get an error → Backend is not running

4. **Redeploy Netlify site:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Wait for build to complete (2-3 minutes)

5. **Test registration again:**
   - Visit: `https://beamish-granita-b7abb8.netlify.app/register`
   - Open browser console (F12) → **Network** tab
   - Try to register
   - Check the request URL - should be your Railway backend, not Netlify

## Common Issues

### Issue: Value looks correct but still getting 404

**Solution:**
- Make sure you **redeployed** after setting the variable
- Environment variables are only injected during the build process
- Old builds don't have the new variable

### Issue: Backend health check fails

**Solution:**
- Check Railway dashboard → **Logs** for errors
- Verify backend is running (not crashed)
- Check Railway **Variables** - ensure `NODE_ENV=production` is set

### Issue: CORS errors after fixing API URL

**Solution:**
- Verify backend CORS allows Netlify domain
- Check Railway has `NODE_ENV=production` set
- Backend should allow `*.netlify.app` domains

