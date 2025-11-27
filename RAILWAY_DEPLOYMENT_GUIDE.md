# Railway Deployment Guide for sensebait.pro

## 🚂 Step-by-Step Railway Backend Deployment

### Prerequisites
- [ ] GitHub account
- [ ] Code pushed to a GitHub repository
- [ ] Railway account (we'll create this)

---

## Step 1: Push Code to GitHub (If Not Already Done)

If your code isn't on GitHub yet:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it (e.g., `sensebait-app`)
   - Make it **Public** (for free Railway tier) or **Private** (if you have Railway Pro)
   - Don't initialize with README (if you already have code)

2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
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

## Step 3: Create New Project

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

## Step 4: Configure Project Settings

### 4.1 Set Root Directory

1. **Click on your project** in Railway dashboard
2. **Go to Settings tab**
3. **Find "Root Directory"** section
4. **Set it to:** `backend`
5. **Click "Update"**

### 4.2 Add Environment Variables

1. **Go to Variables tab** in your project
2. **Add these environment variables:**

   ```
   PORT = 5000
   NODE_ENV = production
   JWT_SECRET = <paste-generated-secret>
   ```

3. **To generate JWT_SECRET:**
   - Run locally: `node generate-jwt-secret.js`
   - Or run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Copy the output and paste as JWT_SECRET value

4. **Click "Add" for each variable**

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
   cd backend
   node database/init.js
   ```

3. **Import questions:**
   ```bash
   node scripts/import-questions.js
   ```

4. **Verify database:**
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

3. **Test CORS:**
   - Backend is already configured to allow `sensebait.pro`
   - This should work automatically

---

## Step 8: Prepare Frontend

Once you have your backend URL:

1. **Create frontend/.env file:**
   ```
   REACT_APP_API_URL=https://your-app-name.railway.app
   ```
   (Replace with your actual Railway URL)

2. **Build frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Files ready for upload:**
   - All contents of `frontend/build` folder
   - `.htaccess` file from project root

---

## Step 9: Deploy Frontend to Hostinger

1. **Log in to Hostinger hPanel**
2. **Open File Manager**
3. **Navigate to `public_html`**
4. **Delete default files** (if any)
5. **Upload all contents** from `frontend/build` to `public_html`
6. **Upload `.htaccess`** file to `public_html`
7. **Verify SSL** is enabled for `sensebait.pro`

---

## Step 10: Test Everything

1. **Visit `https://sensebait.pro`**
   - Should load your app

2. **Open browser console (F12)**
   - Check for errors
   - Verify API calls go to your Railway backend URL

3. **Test functionality:**
   - Register a new account
   - Login
   - Browse modules
   - Take a quiz

---

## 🔧 Troubleshooting Railway

### Deployment Fails

**Problem:** Build fails
- **Solution:** Check logs in Railway dashboard
- Verify `Root Directory` is set to `backend`
- Check that `package.json` exists in `backend` folder

**Problem:** Server not starting
- **Solution:** 
  - Check environment variables are set correctly
  - Verify `PORT=5000` is set
  - Check logs for error messages

### Database Issues

**Problem:** Database errors
- **Solution:**
  - Run initialization scripts in Railway shell
  - Check that SQLite file is being created
  - Verify file permissions

### CORS Issues

**Problem:** CORS errors from frontend
- **Solution:**
  - Backend is already configured for `sensebait.pro`
  - Verify backend URL in frontend `.env` is correct
  - Check Railway logs for CORS-related errors

---

## 📊 Railway Dashboard Overview

### Key Sections:

1. **Deployments** - View deployment history and logs
2. **Settings** - Configure root directory, domains, etc.
3. **Variables** - Manage environment variables
4. **Metrics** - View resource usage
5. **Shell** - Access command line

### Important Settings:

- **Root Directory:** Must be `backend`
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
- Can set spending limits

---

## 🔄 Updating Your Backend

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

## 📝 Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] Root directory set to `backend`
- [ ] Environment variables added (PORT, NODE_ENV, JWT_SECRET)
- [ ] Deployment successful
- [ ] Backend URL obtained
- [ ] Database initialized
- [ ] Backend health check passes
- [ ] Frontend `.env` created with backend URL
- [ ] Frontend built
- [ ] Files uploaded to Hostinger
- [ ] SSL enabled on sensebait.pro
- [ ] Full functionality tested

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

---

## ✅ Next Steps

Once Railway backend is deployed:

1. **Save your backend URL** (e.g., `https://your-app.railway.app`)
2. **Run:** `node prepare-deployment.js` (or create `.env` manually)
3. **Build frontend:** `cd frontend && npm run build`
4. **Upload to Hostinger**
5. **Test everything!**

Good luck! 🚀

