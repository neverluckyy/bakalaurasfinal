# Environment Variables Configuration

## Required Environment Variables

### For Netlify (Frontend)

Set these in **Netlify Dashboard > Site settings > Environment variables**:

```
REACT_APP_API_URL=https://bakalaurasfinal-production.up.railway.app
```

**Important**: 
- Replace `https://bakalaurasfinal-production.up.railway.app` with your actual Railway backend URL
- After setting, trigger a new deployment (Deploys > Trigger deploy)

### For Railway (Backend)

Set these in **Railway Dashboard > Your Service > Variables**:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ALLOWED_ORIGINS=https://beamish-granita-b7abb8.netlify.app,https://sensebait.pro,https://www.sensebait.pro
FRONTEND_URL=https://sensebait.pro
```

**Important**:
- Replace `https://beamish-granita-b7abb8.netlify.app` with your actual Netlify URL
- The backend will automatically allow all `*.netlify.app` subdomains via regex pattern
- After setting, Railway will automatically redeploy

## Quick Fix for CORS Errors

If you're seeing CORS errors:

1. **Check Railway Variables**: Ensure `ALLOWED_ORIGINS` includes your Netlify URL
2. **Check Netlify Variables**: Ensure `REACT_APP_API_URL` points to your Railway backend
3. **Redeploy Both**: After changing variables, redeploy both services

## Files That Are NOT Needed (Safe to Delete)

These files are gitignored and not needed for deployment:
- `.env` files (set variables in platform dashboards instead)
- `*.db` files (database files)
- `node_modules/` (installed during build)
- `build/` and `dist/` (generated during build)

## Files That ARE Needed for Deployment

### Netlify
- ✅ `netlify.toml` - **REQUIRED** - Netlify configuration
- ✅ `frontend/package.json` - **REQUIRED** - Dependencies
- ✅ `frontend/src/` - **REQUIRED** - Source code

### Railway
- ✅ `railway.json` - **REQUIRED** - Railway configuration
- ✅ `backend/nixpacks.toml` - **REQUIRED** - Build configuration
- ✅ `backend/package.json` - **REQUIRED** - Dependencies
- ✅ `backend/server.js` - **REQUIRED** - Server code
- ✅ `backend/config.env` - **REQUIRED** - Example config (not used in production, but good to have)

## Current Issue Resolution

Based on the CORS errors you're seeing:

1. **Backend CORS is now fixed** - The code now ensures all Netlify subdomains are allowed even when `ALLOWED_ORIGINS` is set
2. **Set `REACT_APP_API_URL` in Netlify** - This tells the frontend where to find the backend
3. **Set `ALLOWED_ORIGINS` in Railway** - This tells the backend which frontend URLs to allow

After setting these variables and redeploying, the CORS errors should be resolved.




