# 🚂 Railway Deployment - Step by Step Guide

This guide will walk you through deploying your full-stack application to Railway.

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] A GitHub account
- [ ] Your code pushed to a GitHub repository
- [ ] Node.js installed locally (for generating JWT secret)

---

## Step 1: Prepare Your Code for GitHub

If your code isn't already on GitHub:

### 1.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit for Railway deployment"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (name it something like `social-engineering-app`)
3. Choose **Public** (for free Railway tier) or **Private** (if you have Railway Pro)
4. **Don't** initialize with README, .gitignore, or license (since you already have code)

### 1.3 Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

---

## Step 2: Generate JWT Secret

Before deploying, generate a secure JWT secret:

```bash
node generate-jwt-secret.js
```

**Copy the output** - you'll need it in Step 5.

Alternatively, you can run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 3: Sign Up for Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Click **"Start a New Project"** or **"Login"**

2. **Sign up with GitHub:**
   - Click **"Login with GitHub"**
   - Authorize Railway to access your GitHub account
   - Complete the signup process

---

## Step 4: Create New Project on Railway

1. **In Railway dashboard:**
   - Click **"New Project"** (or the **"+"** button)
   - Select **"Deploy from GitHub repo"**

2. **Select your repository:**
   - Choose the repository you pushed in Step 1
   - Click **"Deploy Now"**

3. **Railway will automatically:**
   - Detect Node.js
   - Start building your project
   - This may take 2-3 minutes

**Note:** The initial deployment might fail - that's okay! We need to configure settings first.

---

## Step 5: Configure Project Settings

### 5.1 Set Root Directory

1. **Click on your project** in Railway dashboard
2. **Go to Settings tab** (gear icon)
3. **Scroll to "Root Directory"** section
4. **Set it to:** `backend`
5. **Click "Update"**

### 5.2 Add Environment Variables

1. **Go to Variables tab** in your project (or click "Variables" in the sidebar)
2. **Add these environment variables one by one:**

   **Variable 1:**
   - **Name:** `PORT`
   - **Value:** `5000`
   - Click **"Add"**

   **Variable 2:**
   - **Name:** `NODE_ENV`
   - **Value:** `production`
   - Click **"Add"**

   **Variable 3:**
   - **Name:** `JWT_SECRET`
   - **Value:** `<paste-the-secret-from-step-2>`
   - Click **"Add"**

   **Variable 4 (Optional - if you have a custom domain):**
   - **Name:** `ALLOWED_ORIGINS`
   - **Value:** `https://yourdomain.com,https://www.yourdomain.com`
   - Click **"Add"**

3. **Verify all variables are added:**
   - You should see: `PORT`, `NODE_ENV`, `JWT_SECRET` (and optionally `ALLOWED_ORIGINS`)

---

## Step 6: Redeploy Your Project

After configuring settings:

1. **Go to Deployments tab**
2. **Click on the latest deployment**
3. **Click "Redeploy"** (or Railway may auto-redeploy after settings change)
4. **Wait for deployment to complete** (2-3 minutes)
5. **Check the logs** to ensure it's building successfully

**What to look for in logs:**
- ✅ "npm ci" running successfully
- ✅ "npm rebuild sqlite3" running successfully
- ✅ "Server running on port 5000"
- ✅ "Database initialized successfully"

---

## Step 7: Get Your Backend URL

1. **Go to Settings tab**
2. **Scroll to "Domains" section**
3. **Railway provides a default domain** (e.g., `your-app-name.up.railway.app`)
4. **Copy this URL** - this is your backend URL!
5. **Note it down** - you'll need it for the frontend

**If no domain appears:**
- Wait a few minutes for Railway to generate it
- Check that deployment completed successfully
- Try refreshing the page

---

## Step 8: Initialize Database

1. **In Railway dashboard:**
   - Go to your project
   - Click on the **latest deployment**
   - Click **"View Logs"** or find the **"Shell"** tab

2. **Open Railway Shell:**
   - Look for **"Shell"** button or tab
   - Or click **"Open Shell"** button
   - This opens a terminal in your Railway environment

3. **In the shell, run these commands:**
   ```bash
   cd backend
   node database/init.js
   ```

4. **Import questions:**
   ```bash
   node scripts/import-questions.js
   ```

5. **Verify:**
   - Check logs for "Database initialized successfully"
   - Check logs for "Questions imported successfully"

---

## Step 9: Test Your Backend

1. **Test health endpoint:**
   - Visit: `https://your-app-name.up.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test another endpoint:**
   - Visit: `https://your-app-name.up.railway.app/api/test`
   - Should return: `{"message":"Routes are working!","timestamp":"..."}`

3. **Check logs:**
   - In Railway dashboard → Deployments → View Logs
   - Should see: "Server running on port 5000"
   - Should see: "Database initialized successfully"

**If endpoints don't work:**
- Check that deployment completed successfully
- Verify environment variables are set correctly
- Check logs for any error messages
- Ensure PORT is set to 5000

---

## Step 10: Configure Frontend (If Deploying Separately)

If you're deploying the frontend to a different service (like Netlify, Vercel, or Hostinger):

### 10.1 Create Frontend Environment File

1. **Create `frontend/.env` file:**
   ```env
   REACT_APP_API_URL=https://your-app-name.up.railway.app
   ```
   (Replace with your actual Railway backend URL from Step 7)

2. **Build frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Deploy the `frontend/build` folder** to your hosting service

---

## Step 11: (Optional) Deploy Frontend to Railway

If you want to deploy the frontend to Railway as well:

### 11.1 Create Second Service

1. **In Railway dashboard:**
   - Click **"New"** → **"Service"**
   - Select **"Deploy from GitHub repo"**
   - Choose the same repository

2. **Configure Frontend Service:**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l 3000`

3. **Add Environment Variable:**
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-service.up.railway.app`
   - (Use your backend URL from Step 7)

4. **Deploy and get frontend URL**

---

## Step 12: Update CORS (If Needed)

If you're using a custom domain for frontend:

1. **Go to backend service in Railway**
2. **Go to Variables tab**
3. **Update or add `ALLOWED_ORIGINS`:**
   ```
   https://your-frontend-domain.com,https://www.your-frontend-domain.com
   ```
4. **Redeploy backend service**

---

## ✅ Verification Checklist

Before considering deployment complete:

- [ ] Backend deployed successfully on Railway
- [ ] Root directory set to `backend`
- [ ] All environment variables added (PORT, NODE_ENV, JWT_SECRET)
- [ ] Backend URL obtained and working
- [ ] Database initialized successfully
- [ ] Health endpoint returns OK (`/api/health`)
- [ ] Test endpoint works (`/api/test`)
- [ ] Frontend configured with backend URL
- [ ] Frontend deployed (if applicable)
- [ ] Full functionality tested (register, login, etc.)

---

## 🔧 Troubleshooting

### Deployment Fails

**Problem:** Build fails
- **Solution:** 
  - Check logs in Railway dashboard
  - Verify `Root Directory` is set to `backend`
  - Check that `package.json` exists in `backend` folder
  - Ensure `railway.json` or `nixpacks.toml` is correct

**Problem:** Server not starting
- **Solution:** 
  - Check environment variables are set correctly
  - Verify `PORT=5000` is set
  - Check logs for error messages
  - Ensure JWT_SECRET is set

### Database Issues

**Problem:** Database errors
- **Solution:**
  - Run initialization scripts in Railway shell
  - Check that SQLite file is being created
  - Verify file permissions
  - Check logs for SQLite errors

**Problem:** Can't access Railway Shell
- **Solution:**
  - Wait for deployment to complete
  - Try refreshing the page
  - Check that service is running

### CORS Issues

**Problem:** CORS errors from frontend
- **Solution:**
  - Add your frontend domain to `ALLOWED_ORIGINS` environment variable
  - Format: `https://domain.com,https://www.domain.com`
  - Redeploy backend after adding
  - Verify backend URL in frontend `.env` is correct

### Endpoints Not Working

**Problem:** 404 errors on API endpoints
- **Solution:**
  - Verify backend is running (check logs)
  - Ensure routes are registered (check server.js)
  - Test `/api/health` endpoint first
  - Check Railway logs for route registration

---

## 🔄 Updating Your Deployment

Railway automatically redeploys when you push to GitHub:

1. **Make changes to your code**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. **Railway automatically:**
   - Detects the push
   - Rebuilds the project
   - Redeploys

**Manual redeploy:**
- Go to Railway dashboard
- Click on your service
- Go to Deployments tab
- Click "Redeploy" on latest deployment

---

## 📊 Railway Dashboard Overview

### Key Sections:

1. **Deployments** - View deployment history and logs
2. **Settings** - Configure root directory, domains, etc.
3. **Variables** - Manage environment variables
4. **Metrics** - View resource usage (CPU, Memory, Network)
5. **Shell** - Access command line in your deployment

### Important Settings:

- **Root Directory:** Must be `backend` for backend service
- **Build Command:** Auto-detected (usually `npm install`)
- **Start Command:** Auto-detected (usually `npm start`)

---

## 💰 Railway Pricing

**Free Tier:**
- $5 credit per month
- 500 hours of usage
- Perfect for small projects

**If you exceed free tier:**
- Pay-as-you-go pricing
- Very affordable for small apps
- Can set spending limits in settings

---

## 🆘 Need Help?

**Railway Support:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Common Issues:**
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure root directory is correct
4. Test backend URL directly in browser
5. Check that database initialization ran successfully

---

## 📝 Quick Reference

### Backend Service Settings:
- **Root Directory:** `backend`
- **PORT:** `5000`
- **NODE_ENV:** `production`
- **JWT_SECRET:** `<your-generated-secret>`

### Database Initialization Commands:
```bash
cd backend
node database/init.js
node scripts/import-questions.js
```

### Test Endpoints:
- Health: `https://your-app.up.railway.app/api/health`
- Test: `https://your-app.up.railway.app/api/test`

---

## 🎉 Success!

Once all steps are complete, your backend should be:
- ✅ Running on Railway
- ✅ Accessible via Railway domain
- ✅ Database initialized
- ✅ Ready to accept API requests

**Next Steps:**
1. Deploy your frontend (if not already done)
2. Update frontend to use Railway backend URL
3. Test full application functionality
4. Set up custom domain (optional)

Good luck! 🚀

