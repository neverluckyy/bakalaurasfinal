# 🚀 Netlify Deployment Guide

This guide will help you deploy your React frontend to Netlify.

## 📋 Prerequisites

1. **Backend deployed** - Your backend should be deployed on Railway, Render, or another service
2. **Backend URL** - You'll need your backend API URL (e.g., `https://your-app.railway.app`)
3. **GitHub account** - Netlify works best with GitHub integration
4. **Netlify account** - Sign up at https://www.netlify.com (free tier available)

---

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Ensure your code is on GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Prepare for Netlify deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2: Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Sign up or log in with GitHub

2. **Create a new site:**
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose **"Deploy with GitHub"**
   - Authorize Netlify to access your GitHub account
   - Select your repository

3. **Configure build settings:**
   Netlify should auto-detect the settings from `netlify.toml`, but verify:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/build`

4. **Add environment variables:**
   - Click **"Show advanced"** → **"New variable"**
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.railway.app`
   - Replace with your actual backend URL

5. **Deploy:**
   - Click **"Deploy site"**
   - Wait for the build to complete (2-5 minutes)

#### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize and deploy:**
   ```bash
   cd frontend
   netlify init
   ```
   - Follow the prompts to link your site
   - Choose "Create & configure a new site"
   - Select your team
   - Build command: `npm run build`
   - Directory to deploy: `build`

4. **Set environment variable:**
   ```bash
   netlify env:set REACT_APP_API_URL https://your-backend-url.railway.app
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Step 3: Configure Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Go to **Site settings** → **Domain management**
   - Click **"Add custom domain"**
   - Enter your domain (e.g., `sensebait.pro`)
   - Follow DNS configuration instructions

2. **Update CORS in backend:**
   - Make sure your backend allows requests from your Netlify domain
   - Update CORS settings in your backend code if needed

### Step 4: Verify Deployment

1. **Visit your Netlify URL:**
   - Netlify provides a URL like: `https://your-site-name.netlify.app`
   - Or your custom domain if configured

2. **Test the application:**
   - Open browser console (F12)
   - Check for any errors
   - Verify API calls are going to your backend URL
   - Test registration, login, and other features

3. **Check build logs:**
   - In Netlify dashboard, go to **Deploys**
   - Click on the latest deploy
   - Check for any build errors or warnings

---

## 🔧 Configuration Files

### `netlify.toml`
This file is already created in your project root and contains:
- Build settings (base directory, build command, publish directory)
- Redirect rules for React Router (SPA routing)
- Headers for caching static assets

### `frontend/public/_redirects`
This file ensures all routes are handled by `index.html` for client-side routing.

---

## 🌍 Environment Variables

### Required Environment Variable

**`REACT_APP_API_URL`**
- **Purpose:** Backend API URL
- **Example:** `https://your-app.railway.app`
- **Where to set:** Netlify Dashboard → Site settings → Environment variables

### Setting Environment Variables in Netlify

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** Your backend URL
4. Click **"Save"**
5. **Redeploy** your site for changes to take effect

---

## 🔄 Continuous Deployment

Netlify automatically deploys when you push to your main branch:

1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Netlify automatically builds and deploys** your changes

---

## 🐛 Troubleshooting

### Build Fails

**Issue:** Build command fails
- **Solution:** Check build logs in Netlify dashboard
- Verify `package.json` has correct build script
- Ensure all dependencies are in `package.json`

**Issue:** Environment variables not working
- **Solution:** 
  - Verify variable name starts with `REACT_APP_`
  - Redeploy after adding/changing variables
  - Check variable is set for correct environment (production)

### App Shows White Screen

**Issue:** React Router routes not working
- **Solution:** 
  - Verify `_redirects` file exists in `frontend/public/`
  - Check `netlify.toml` has redirect rules
  - Ensure redirect status is `200` (not `301` or `302`)

### API Calls Failing

**Issue:** CORS errors or API not responding
- **Solution:**
  - Verify `REACT_APP_API_URL` is set correctly
  - Check backend CORS settings allow your Netlify domain
  - Test backend URL directly in browser
  - Check browser console for specific error messages

### Assets Not Loading

**Issue:** Images or other assets return 404
- **Solution:**
  - Verify assets are in `frontend/public/` folder
  - Check file paths in code (should be relative to public folder)
  - Rebuild and redeploy

---

## 📝 Quick Reference

### Netlify Build Settings
```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/build
```

### Environment Variable
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### Important Files
- `netlify.toml` - Netlify configuration
- `frontend/public/_redirects` - React Router redirects
- `frontend/.env` - Local environment variables (not used in Netlify)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify account created
- [ ] Site created and linked to GitHub repository
- [ ] Build settings configured (auto-detected from `netlify.toml`)
- [ ] Environment variable `REACT_APP_API_URL` set
- [ ] Initial deployment successful
- [ ] Site loads at Netlify URL
- [ ] React Router routes work correctly
- [ ] API calls connect to backend
- [ ] Registration works
- [ ] Login works
- [ ] All features tested
- [ ] Custom domain configured (optional)

---

## 🎉 You're Done!

Your frontend is now deployed on Netlify! 

**Next Steps:**
- Set up a custom domain if desired
- Configure automatic deployments
- Monitor your site in Netlify dashboard
- Set up form handling or serverless functions if needed

**Need Help?**
- Netlify Docs: https://docs.netlify.com
- Netlify Community: https://answers.netlify.com

