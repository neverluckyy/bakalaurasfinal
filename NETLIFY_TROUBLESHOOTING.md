# 🔧 Netlify Troubleshooting Guide

## Website Can't Be Reached - Quick Fixes

### Step 1: Check Netlify Dashboard

1. Go to https://app.netlify.com
2. Click on your site
3. Check the **"Deploys"** tab:
   - ✅ **Green checkmark** = Site is live
   - ❌ **Red X** = Build failed (see Step 2)
   - 🟡 **Yellow circle** = Building (wait 2-3 minutes)

### Step 2: If Build Failed

1. Click on the failed deployment
2. Scroll down to see the error message
3. Common errors and fixes:

#### Error: "Build command failed"
- **Fix**: Check that `netlify.toml` exists in your repo root
- **Fix**: Verify build command is `npm run build`

#### Error: "Module not found" or "Cannot find module"
- **Fix**: Make sure `node_modules` is NOT committed to git
- **Fix**: Netlify will install dependencies automatically

#### Error: "ESLint errors"
- **Fix**: We already fixed these, make sure code is pushed to GitHub

### Step 3: Verify Repository Connection

1. In Netlify dashboard → **Site settings** → **Build & deploy**
2. Check **"Connected repository"**:
   - Should show your GitHub repo
   - If not connected, click **"Link repository"** and connect it

### Step 4: Check Build Settings

1. In Netlify dashboard → **Site settings** → **Build & deploy** → **Build settings**
2. Should show:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

   If these are empty or wrong, Netlify will use `netlify.toml` (which we created).

### Step 5: Trigger Manual Deploy

1. In Netlify dashboard → **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 2-3 minutes for build to complete

### Step 6: Verify Code is Pushed to GitHub

```bash
# Check if you have uncommitted changes
git status

# If you have changes, commit and push:
git add .
git commit -m "Fix Netlify deployment"
git push
```

### Step 7: Check Environment Variables

1. In Netlify dashboard → **Site settings** → **Environment variables**
2. Verify `REACT_APP_API_URL` is set to your Railway backend URL
3. If missing, add it:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend.railway.app`

### Step 8: Test the Site

1. After successful deployment, visit:
   - `https://beamish-granita-b7abb8.netlify.app`
   - Or your custom domain if configured

2. If you see a blank page:
   - Open browser console (F12)
   - Check for errors
   - Verify `REACT_APP_API_URL` is set correctly

## Common Issues

### Issue: "Site not found" or 404
- **Cause**: Site was deleted or never deployed
- **Fix**: Check if site exists in Netlify dashboard, if not, create a new site

### Issue: Build succeeds but site is blank
- **Cause**: Missing `index.html` or wrong publish directory
- **Fix**: Verify `publish = "build"` in `netlify.toml`

### Issue: Routes return 404
- **Cause**: Redirects not configured
- **Fix**: `netlify.toml` already has redirects configured

### Issue: API calls fail
- **Cause**: `REACT_APP_API_URL` not set or incorrect
- **Fix**: Set environment variable in Netlify dashboard

## Still Not Working?

1. **Check Netlify Status**: https://www.netlifystatus.com
2. **Check Build Logs**: Full error messages in deploy logs
3. **Try Rebuilding**: Delete site and reconnect repository
4. **Contact Support**: Netlify has good support documentation

