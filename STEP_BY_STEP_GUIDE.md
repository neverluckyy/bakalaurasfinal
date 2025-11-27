# Complete Step-by-Step Deployment Guide

## 🎯 Goal: Get your app live on sensebait.pro

Since you have Hostinger Single Web Hosting (which doesn't support Node.js), we'll:
- **Backend**: Host on Railway (free)
- **Frontend**: Host on Hostinger

---

## 📋 PART 1: Deploy Backend to Railway

### Step 1.1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub

### Step 1.2: Create New Project

1. Click **"New Project"** (big button)
2. Select **"Deploy from GitHub repo"**
3. If prompted, authorize Railway to access your repositories
4. Find and select your repository (the one with this project)
5. Click on it to deploy

### Step 1.3: Configure the Project

1. Railway will start deploying automatically
2. **STOP** - Before it finishes, click on your project name
3. Go to **"Settings"** tab
4. Scroll to **"Root Directory"**
5. Change it to: `backend`
6. Click **"Save"**

### Step 1.4: Add Environment Variables

1. Still in **"Settings"**, find **"Variables"** section
2. Click **"New Variable"** for each:

   **Variable 1:**
   - Name: `PORT`
   - Value: `5000`
   - Click **"Add"**

   **Variable 2:**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click **"Add"**

   **Variable 3:**
   - Name: `JWT_SECRET`
   - Value: (generate this - see below)
   - Click **"Add"**

### Step 1.5: Generate JWT Secret

**On your local computer**, open terminal/command prompt and run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the long string that appears (it's your secret key). Paste it as the value for `JWT_SECRET` in Railway.

### Step 1.6: Wait for Deployment

1. Go back to **"Deployments"** tab
2. Wait for deployment to finish (2-5 minutes)
3. You'll see a green checkmark when done
4. Click on the deployment
5. Find **"Domains"** section
6. Click **"Generate Domain"** (or use the default one)
7. **COPY THIS URL** - it looks like: `https://your-app-name.railway.app`
8. **SAVE IT** - you'll need it later!

### Step 1.7: Test Backend

1. Open the URL you copied in a new browser tab
2. Add `/api/health` to the end: `https://your-app-name.railway.app/api/health`
3. You should see: `{"status":"OK","timestamp":"..."}`
4. ✅ If you see this, backend is working!

---

## 📋 PART 2: Initialize Database

### Step 2.1: Open Railway Shell

1. In Railway, go to your project
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"** button
5. Click **"Shell"** tab (at the top)

### Step 2.2: Run Database Scripts

In the shell, type these commands one by one:

```bash
cd backend
```

Press Enter, then:

```bash
node database/init.js
```

Press Enter, wait for "Database initialized" message, then:

```bash
node scripts/import-questions.js
```

Press Enter, wait for import to complete.

✅ Database is now ready!

---

## 📋 PART 3: Build Frontend

### Step 3.1: Create Environment File

**On your local computer:**

1. Navigate to your project folder
2. Go to `frontend` folder
3. Create a new file named `.env` (exactly this name, with the dot)
4. Open `.env` in a text editor
5. Add this line (replace with YOUR Railway URL):

```
REACT_APP_API_URL=https://your-app-name.railway.app
```

**Example:**
```
REACT_APP_API_URL=https://sensebait-backend-production.up.railway.app
```

6. Save the file

### Step 3.2: Install Dependencies (if not done)

Open terminal/command prompt in the `frontend` folder:

```bash
npm install
```

Wait for it to finish.

### Step 3.3: Build the App

Still in `frontend` folder, run:

```bash
npm run build
```

Wait 1-3 minutes. You'll see:
```
Creating an optimized production build...
Build completed successfully.
```

✅ A `build` folder is created with production files!

---

## 📋 PART 4: Upload to Hostinger

### Step 4.1: Access Hostinger File Manager

1. Log in to **Hostinger hPanel**
2. Find **"File Manager"** (usually in "Files" section)
3. Click to open it

### Step 4.2: Navigate to public_html

1. In File Manager, you'll see folders
2. Find and open **`public_html`** folder
3. This is where your website files go

### Step 4.3: Clean Up (if needed)

1. If there are default files (like `index.html`, `cgi-bin`, etc.)
2. Select them and delete (or move to a backup folder)
3. Keep `public_html` empty or with only your files

### Step 4.4: Upload Build Files

**Option A: Using File Manager Upload**

1. In `public_html`, click **"Upload"** button
2. Navigate to your local `frontend/build` folder
3. Select **ALL files and folders** inside `build`:
   - `index.html`
   - `static` folder
   - `asset-manifest.json` (if present)
   - `manifest.json` (if present)
   - `robots.txt` (if present)
4. Upload them
5. Wait for upload to complete

**Option B: Using FTP (FileZilla, WinSCP)**

1. Connect to your Hostinger FTP
2. Navigate to `public_html`
3. Upload all contents from `frontend/build` folder
4. Make sure `index.html` is directly in `public_html`

### Step 4.5: Upload .htaccess File

1. In File Manager, still in `public_html`
2. Click **"Upload"**
3. Find `.htaccess` file (in your project root folder)
4. Upload it to `public_html`

### Step 4.6: Verify Structure

Your `public_html` should look like:
```
public_html/
├── index.html
├── .htaccess
├── static/
│   ├── css/
│   ├── js/
│   └── media/
└── (other files)
```

✅ Files are uploaded!

---

## 📋 PART 5: Configure Domain & SSL

### Step 5.1: Check Domain Connection

1. In Hostinger hPanel, go to **"Domains"**
2. Click **"Manage"** next to sensebait.pro
3. Verify it's connected to your hosting

### Step 5.2: Enable SSL

1. In hPanel, find **"SSL"** section
2. Look for **"Let's Encrypt SSL"** or **"Free SSL"**
3. Click **"Install"** or **"Enable"** for sensebait.pro
4. Wait 5-10 minutes for activation

### Step 5.3: Test Your Site

1. Open a new browser tab
2. Visit: **https://sensebait.pro**
3. You should see your app!

---

## 📋 PART 6: Testing & Troubleshooting

### Test Checklist

1. ✅ **Site loads**: Visit https://sensebait.pro
2. ✅ **No console errors**: Press F12, check Console tab
3. ✅ **Registration works**: Try creating an account
4. ✅ **Login works**: Log in with your account
5. ✅ **Navigation works**: Click through modules
6. ✅ **API calls work**: Check Network tab (F12) for API requests

### Common Issues & Fixes

#### ❌ White Screen / Nothing Loads

**Fix:**
- Check that `index.html` is in `public_html` root
- Verify `.htaccess` is uploaded
- Check browser console (F12) for errors

#### ❌ API Errors / CORS Errors

**Fix:**
1. Verify `frontend/.env` has correct Railway URL
2. Rebuild frontend: `cd frontend && npm run build`
3. Re-upload `build` folder contents
4. Check backend CORS allows sensebait.pro (already configured)

#### ❌ 404 on Page Refresh

**Fix:**
- Ensure `.htaccess` file is in `public_html`
- Verify `.htaccess` content is correct

#### ❌ Backend Not Responding

**Fix:**
1. Check Railway dashboard for errors
2. Verify environment variables are set
3. Test backend URL directly: `https://your-backend.railway.app/api/health`
4. Check Railway logs for errors

#### ❌ Database Errors

**Fix:**
1. Go to Railway shell
2. Run: `cd backend && node database/init.js`
3. Run: `cd backend && node scripts/import-questions.js`

---

## 🎉 Success!

If everything works:
- ✅ Frontend: https://sensebait.pro
- ✅ Backend: https://your-backend.railway.app
- ✅ Users can register, login, and use the app!

---

## 📞 Need More Help?

**If you're stuck on a specific step:**

1. **Railway issues**: Check Railway dashboard → Logs
2. **Hostinger issues**: Check File Manager → file structure
3. **Build issues**: Check terminal for error messages
4. **Browser issues**: Check browser console (F12)

**Common Questions:**

**Q: Where do I find my Railway URL?**
A: Railway dashboard → Your project → Deployments → Domains section

**Q: What if Railway asks for payment?**
A: Use the free tier - it's enough for your app. Don't add a credit card unless you want to upgrade.

**Q: Can I use a different backend host?**
A: Yes! Render.com or Fly.io work too. See DEPLOYMENT_GUIDE.md for alternatives.

**Q: How do I update the site later?**
A: 
- Backend: Push to GitHub, Railway auto-deploys
- Frontend: Rebuild (`npm run build`) and re-upload to Hostinger

---

Good luck! You've got this! 🚀

