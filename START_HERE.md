# 🚀 START HERE - Railway Deployment for sensebait.pro

## ✅ What's Ready

- ✅ JWT Secret generated (see below)
- ✅ Railway deployment guide created
- ✅ Frontend build configuration ready
- ✅ All deployment files prepared

---

## 🔑 Your JWT Secret

**Save this for Railway environment variables:**

```
d7ffb8412931457ed70498876db4c43e3255f859292e958d1238469c8f64834ecae4fe642431605d46a992363913f7a7b739aed01c2cfe094d4caa7a7a5bb834
```

**⚠️ Important:** Keep this secret secure! Use it only in Railway environment variables.

---

## 📋 Step-by-Step Deployment

### Phase 1: Railway Backend (15-20 minutes)

#### Step 1: Push Code to GitHub
**If your code isn't on GitHub yet:**

1. Create a new repository at https://github.com/new
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

#### Step 2: Deploy to Railway

1. **Go to:** https://railway.app
2. **Sign up** with GitHub (click "Login with GitHub")
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Wait for initial deployment** (2-3 minutes)

#### Step 3: Configure Railway

1. **In Railway dashboard, click on your project**
2. **Go to Settings tab:**
   - Find **"Root Directory"**
   - Set it to: `backend`
   - Click **"Update"**

3. **Go to Variables tab:**
   - Click **"New Variable"**
   - Add these three variables:
   
     ```
     Name: PORT
     Value: 5000
     ```
     
     ```
     Name: NODE_ENV
     Value: production
     ```
     
     ```
     Name: JWT_SECRET
     Value: d7ffb8412931457ed70498876db4c43e3255f859292e958d1238469c8f64834ecae4fe642431605d46a992363913f7a7b739aed01c2cfe094d4caa7a7a5bb834
     ```

4. **Save all variables**

#### Step 4: Get Your Backend URL

1. **Go to Settings tab**
2. **Scroll to "Domains" section**
3. **Railway will show a domain** like: `your-app-name.railway.app`
4. **Copy this URL** - this is your backend URL!
5. **Test it:** Visit `https://your-app-name.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

#### Step 5: Initialize Database

1. **In Railway dashboard:**
   - Go to your project
   - Click on **latest deployment**
   - Click **"View Logs"**
   - Click **"Shell"** tab (or "Open Shell")

2. **In the shell, run:**
   ```bash
   cd backend
   node database/init.js
   ```

3. **Import questions:**
   ```bash
   node scripts/import-questions.js
   ```

4. **Verify:**
   - Check logs for "Database initialized successfully"
   - Check logs for "Questions imported successfully"

---

### Phase 2: Frontend Build (5 minutes)

#### Step 1: Create Frontend Environment File

**Replace `YOUR_RAILWAY_URL` with your actual Railway URL from Phase 1:**

```bash
# Windows PowerShell
echo "REACT_APP_API_URL=https://YOUR_RAILWAY_URL.railway.app" > frontend\.env

# Or create the file manually:
# Create frontend/.env with this content:
# REACT_APP_API_URL=https://your-app-name.railway.app
```

#### Step 2: Build Frontend

```bash
cd frontend
npm install
npm run build
```

This creates a `build` folder with production files.

---

### Phase 3: Upload to Hostinger (10 minutes)

#### Step 1: Access Hostinger

1. **Log in to Hostinger hPanel**
2. **Open File Manager**
3. **Navigate to `public_html` folder**

#### Step 2: Upload Files

1. **Delete any default files** in `public_html` (if present)
2. **Upload ALL contents** from `frontend/build` folder:
   - Select all files and folders inside `frontend/build`
   - Upload to `public_html`
   - Make sure `index.html` is directly in `public_html` root

3. **Upload `.htaccess` file:**
   - Upload the `.htaccess` file from your project root
   - Place it in `public_html`

#### Step 3: Verify File Structure

Your `public_html` should look like:
```
public_html/
├── index.html
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── .htaccess
└── (other files)
```

#### Step 4: Enable SSL

1. **In Hostinger hPanel:**
   - Go to **"Domains"** → **"Manage"**
   - Ensure `sensebait.pro` is connected
   - Go to **"SSL"** section
   - Enable SSL certificate (Let's Encrypt - usually auto-enabled)
   - Verify it shows as "Active" or "Enabled"

---

### Phase 4: Testing (5 minutes)

#### Step 1: Test Frontend

1. **Visit:** `https://sensebait.pro`
2. **Should see:** Your app loading
3. **Open browser console (F12):**
   - Check for errors
   - Verify API calls are going to your Railway backend URL

#### Step 2: Test Backend

1. **Visit:** `https://your-app-name.railway.app/api/health`
2. **Should return:** `{"status":"OK","timestamp":"..."}`

#### Step 3: Test Full Functionality

1. **Register** a new account
2. **Login** with your account
3. **Browse modules**
4. **Take a quiz**
5. **Check leaderboard**

---

## 📚 Documentation Files

- **RAILWAY_DEPLOYMENT_GUIDE.md** - Detailed Railway guide
- **railway-quick-start.md** - Quick reference
- **HOSTINGER_DEPLOYMENT_CHECKLIST.md** - Complete checklist
- **DEPLOYMENT_SUMMARY.md** - Overview

---

## 🆘 Troubleshooting

### Railway Issues

**Deployment fails:**
- Check Railway logs for errors
- Verify Root Directory is set to `backend`
- Ensure all environment variables are set

**Backend not responding:**
- Check Railway logs
- Verify PORT=5000 is set
- Test health endpoint directly

### Frontend Issues

**White screen:**
- Check that `index.html` is in `public_html` root
- Verify `.htaccess` is uploaded
- Check browser console for errors

**API calls failing:**
- Verify `REACT_APP_API_URL` in `frontend/.env` matches Railway URL
- Rebuild frontend if you changed `.env`
- Check CORS in backend logs

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] Root directory set to `backend`
- [ ] Environment variables added (PORT, NODE_ENV, JWT_SECRET)
- [ ] Backend URL obtained from Railway
- [ ] Database initialized in Railway shell
- [ ] Backend health check passes
- [ ] Frontend `.env` created with Railway URL
- [ ] Frontend built successfully
- [ ] Files uploaded to Hostinger `public_html`
- [ ] `.htaccess` uploaded to Hostinger
- [ ] SSL enabled on sensebait.pro
- [ ] Website loads at https://sensebait.pro
- [ ] Registration works
- [ ] Login works
- [ ] All features tested

---

## 🎯 Quick Reference

**Railway Backend URL Format:**
```
https://your-app-name.railway.app
```

**Frontend Environment Variable:**
```env
REACT_APP_API_URL=https://your-app-name.railway.app
```

**Railway Environment Variables:**
```
PORT=5000
NODE_ENV=production
JWT_SECRET=d7ffb8412931457ed70498876db4c43e3255f859292e958d1238469c8f64834ecae4fe642431605d46a992363913f7a7b739aed01c2cfe094d4caa7a7a5bb834
```

---

## 🚀 Ready to Start?

1. **Push your code to GitHub** (if not done)
2. **Follow Phase 1** to deploy to Railway
3. **Get your Railway backend URL**
4. **Follow Phase 2** to build frontend
5. **Follow Phase 3** to upload to Hostinger
6. **Test everything!**

**Need help?** Check the detailed guides or ask questions!

Good luck! 🎉

