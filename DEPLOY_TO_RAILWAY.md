# 🚂 Deploy to Railway - Step by Step Guide

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Railway account (we'll create this)

---

## Step 1: Prepare Your Code for GitHub

If your code isn't on GitHub yet:

1. **Initialize git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it (e.g., `bakalauras-app`)
   - Make it **Public** (for free Railway tier) or **Private** (if you have Railway Pro)
   - Don't initialize with README (you already have code)

3. **Push your code:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## Step 2: Sign Up for Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Click **"Start a New Project"** or **"Login"**

2. **Sign up with GitHub:**
   - Click **"Login with GitHub"**
   - Authorize Railway to access your GitHub account
   - Complete the signup process

---

## Step 3: Create New Project on Railway

1. **In Railway dashboard:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository from the list
   - Click **"Deploy Now"**

2. **Railway will automatically:**
   - Detect Node.js
   - Start building your project
   - This may take 2-3 minutes

---

## Step 4: Configure Railway Settings

### 4.1 Set Root Directory

**This is CRITICAL - Railway needs to know where your backend code is:**

1. **Click on your project** in Railway dashboard
2. **Go to Settings tab**
3. **Find "Root Directory"** section
4. **Set it to:** `backend`
5. **Click "Update"**
6. **Railway will automatically redeploy** (wait 2-3 minutes)

### 4.2 Add Environment Variables

1. **Go to Variables tab** in your project
2. **Click "New Variable"** for each of these:

   **Variable 1:**
   ```
   Name: PORT
   Value: 5000
   ```

   **Variable 2:**
   ```
   Name: NODE_ENV
   Value: production
   ```

   **Variable 3:**
   ```
   Name: JWT_SECRET
   Value: 26943b1d5691081eaf5533f9318952db445bdc54001731085d32cc0b986c406277e1a5ff38d82ddbffb92d353427789b7fda08aa544a08938c4ec78c4954f12e
   ```
   *(This is a fresh secret generated for you - keep it secure!)*

3. **Optional - If you have a custom domain for frontend:**
   ```
   Name: ALLOWED_ORIGINS
   Value: https://yourdomain.com,https://www.yourdomain.com
   ```

4. **Optional - If you need email functionality:**
   ```
   Name: SMTP_HOST
   Value: smtp.gmail.com
   
   Name: SMTP_PORT
   Value: 587
   
   Name: SMTP_SECURE
   Value: false
   
   Name: SMTP_USER
   Value: your-email@gmail.com
   
   Name: SMTP_PASS
   Value: your-app-password
   
   Name: FRONTEND_URL
   Value: https://yourdomain.com
   ```

5. **Save all variables** - Railway will automatically redeploy

---

## Step 5: Get Your Backend URL

1. **Go to Settings tab**
2. **Scroll to "Domains" section**
3. **Railway provides a default domain** (e.g., `your-app-name.railway.app`)
4. **Copy this URL** - this is your backend URL!
5. **Test it:** Visit `https://your-app-name.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

**Note:** Railway may take a few minutes to generate the domain. Wait for deployment to complete.

---

## Step 6: Initialize Database

1. **In Railway dashboard:**
   - Go to your project
   - Click on the **latest deployment**
   - Click **"View Logs"**
   - Click **"Shell"** tab (or look for "Open Shell" button)

2. **In the shell, run:**
   ```bash
   node database/init.js
   ```

3. **Import questions:**
   ```bash
   node scripts/import-questions.js
   ```

4. **Optional - Add default modules:**
   ```bash
   node scripts/add-default-modules.js
   ```

5. **Verify database:**
   - Check logs for "Database initialized successfully"
   - Check logs for "Questions imported successfully"

---

## Step 7: Verify Backend is Working

1. **Test health endpoint:**
   - Visit: `https://your-app-name.railway.app/api/health`
   - Should return JSON with status "OK"

2. **Check logs:**
   - In Railway dashboard → Deployments → View Logs
   - Should see: "Server running on port 5000"
   - Should see: "Database initialized successfully"

3. **Test API endpoint:**
   - Visit: `https://your-app-name.railway.app/api/test`
   - Should return: `{"message":"Routes are working!","timestamp":"..."}`

---

## Step 8: Update Frontend Configuration

Once you have your Railway backend URL:

1. **Create or update `frontend/.env` file:**
   ```env
   VITE_API_URL=https://your-app-name.railway.app
   ```
   *(Replace with your actual Railway URL - no trailing slash!)*

2. **Rebuild frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **The built files will be in `frontend/dist`** (for Vite) or `frontend/build` (for Create React App)

---

## Step 9: Troubleshooting

### Deployment Fails

**Problem:** Build fails
- **Solution:** 
  - Check logs in Railway dashboard
  - Verify `Root Directory` is set to `backend`
  - Check that `package.json` exists in `backend` folder
  - Ensure `nixpacks.toml` or `Dockerfile` is correct

**Problem:** Server not starting
- **Solution:** 
  - Check environment variables are set correctly
  - Verify `PORT=5000` is set (or let Railway auto-assign)
  - Check logs for error messages
  - Ensure `NODE_ENV=production` is set

### Database Issues

**Problem:** Database errors
- **Solution:**
  - Run initialization scripts in Railway shell
  - Check that SQLite file is being created
  - Verify file permissions
  - Check logs for SQLite errors

**Problem:** "Database initialized successfully" but tables missing
- **Solution:**
  - Run `node database/init.js` again in Railway shell
  - Check logs for any errors during initialization

### CORS Issues

**Problem:** CORS errors from frontend
- **Solution:**
  - Verify backend URL in frontend `.env` is correct
  - Check Railway logs for CORS-related errors
  - Ensure `ALLOWED_ORIGINS` includes your frontend domain
  - Verify `NODE_ENV=production` is set

### No Logs Showing

**Problem:** Railway shows no logs
- **Solution:**
  - Verify `Root Directory` is set to `backend`
  - Check that deployment completed successfully
  - Wait a few minutes for logs to appear
  - Try redeploying

---

## Step 10: Monitor Your Deployment

### Railway Dashboard Sections:

1. **Deployments** - View deployment history and logs
2. **Settings** - Configure root directory, domains, etc.
3. **Variables** - Manage environment variables
4. **Metrics** - View resource usage (CPU, Memory, Network)
5. **Shell** - Access command line

### Important Settings:

- **Root Directory:** Must be `backend`
- **Build Command:** Auto-detected (uses `nixpacks.toml` or `Dockerfile`)
- **Start Command:** Auto-detected (usually `node server.js`)

---

## Step 11: Updating Your Backend

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
- Click "Redeploy" on latest deployment

---

## 📊 Quick Reference

### Your Railway Backend URL Format:
```
https://your-app-name.railway.app
```

### Required Environment Variables:
```
PORT=5000
NODE_ENV=production
JWT_SECRET=26943b1d5691081eaf5533f9318952db445bdc54001731085d32cc0b986c406277e1a5ff38d82ddbffb92d353427789b7fda08aa544a08938c4ec78c4954f12e
```

### Frontend Environment Variable:
```env
VITE_API_URL=https://your-app-name.railway.app
```

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] Root directory set to `backend`
- [ ] Environment variables added (PORT, NODE_ENV, JWT_SECRET)
- [ ] Deployment successful
- [ ] Backend URL obtained
- [ ] Database initialized
- [ ] Backend health check passes (`/api/health`)
- [ ] Frontend `.env` created with backend URL
- [ ] Frontend rebuilt with new backend URL
- [ ] All features tested

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
5. Check that database was initialized

---

## 🎉 Success!

Once your backend is deployed and working:
1. **Save your Railway backend URL**
2. **Update your frontend** with the new backend URL
3. **Rebuild and deploy your frontend** (to Netlify, Hostinger, or wherever)
4. **Test everything!**

Good luck! 🚀

