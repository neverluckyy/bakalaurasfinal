# Deployment Guide

This guide explains how to deploy the application to Netlify (frontend) and Railway (backend).

## Prerequisites

- Netlify account
- Railway account
- Git repository

## Backend Deployment (Railway)

### 1. Deploy to Railway

1. Connect your GitHub repository to Railway
2. Create a new service from your repository
3. Railway will automatically detect the `railway.json` and `backend/nixpacks.toml` files

### 2. Set Environment Variables in Railway

Go to Railway Dashboard > Your Service > Variables and set:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ALLOWED_ORIGINS=https://beamish-granita-b7abb8.netlify.app,https://sensebait.pro,https://www.sensebait.pro
FRONTEND_URL=https://sensebait.pro
```

**Important**: Replace `https://beamish-granita-b7abb8.netlify.app` with your actual Netlify URL.

### 3. Get Your Railway Backend URL

After deployment, Railway will provide a URL like:
- `https://bakalaurasfinal-production.up.railway.app`

Copy this URL - you'll need it for the frontend configuration.

## Frontend Deployment (Netlify)

### 1. Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the `netlify.toml` file
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

### 2. Set Environment Variables in Netlify

Go to Netlify Dashboard > Site settings > Environment variables and set:

```
REACT_APP_API_URL=https://bakalaurasfinal-production.up.railway.app
```

**Important**: Replace `https://bakalaurasfinal-production.up.railway.app` with your actual Railway backend URL.

### 3. Redeploy After Setting Variables

After setting environment variables, trigger a new deployment:
- Go to Deploys tab
- Click "Trigger deploy" > "Deploy site"

## Required Files for Deployment

### Netlify
- ✅ `netlify.toml` - Netlify configuration (build settings, redirects, headers)
- ✅ `frontend/package.json` - Frontend dependencies
- ✅ `frontend/src/index.jsx` - Uses `REACT_APP_API_URL` environment variable

### Railway
- ✅ `railway.json` - Railway build and deploy configuration
- ✅ `backend/nixpacks.toml` - Nixpacks build configuration
- ✅ `backend/package.json` - Backend dependencies
- ✅ `backend/server.js` - Uses `ALLOWED_ORIGINS` environment variable

## Troubleshooting CORS Errors

If you see CORS errors in the browser console:

1. **Check Railway Environment Variables**:
   - Ensure `ALLOWED_ORIGINS` includes your Netlify URL
   - Format: `https://your-site.netlify.app,https://your-custom-domain.com`
   - No spaces after commas

2. **Check Netlify Environment Variables**:
   - Ensure `REACT_APP_API_URL` is set to your Railway backend URL
   - Must start with `https://`
   - No trailing slash

3. **Verify Backend is Running**:
   - Check Railway logs to ensure the backend started successfully
   - Test the backend URL directly: `https://your-railway-url.up.railway.app/api/health`

4. **Redeploy Both Services**:
   - After changing environment variables, redeploy both Netlify and Railway
   - Environment variables are only available at build time (Netlify) or runtime (Railway)

## Common Issues

### Issue: CORS header 'Access-Control-Allow-Origin' missing
**Solution**: Add your Netlify URL to `ALLOWED_ORIGINS` in Railway and redeploy.

### Issue: 502 Bad Gateway
**Solution**: Check Railway logs - the backend might not be starting correctly.

### Issue: API calls fail with "CORS request did not succeed"
**Solution**: 
- Verify `REACT_APP_API_URL` is set correctly in Netlify
- Ensure the Railway backend URL is accessible
- Check that the backend is running (test `/api/health` endpoint)

### Issue: Login fails after deployment
**Solution**:
- Verify `REACT_APP_API_URL` points to the correct Railway backend
- Check that `ALLOWED_ORIGINS` in Railway includes your Netlify URL
- Ensure both services are redeployed after setting environment variables




