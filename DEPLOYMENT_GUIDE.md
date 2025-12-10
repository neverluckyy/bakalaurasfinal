# Deployment Guide for Hostinger Single Web Hosting

This guide will help you deploy your Social Engineering Learning App to **sensebait.pro** using Hostinger's Single Web Hosting plan.

## Overview

Since Hostinger Single Web Hosting doesn't support Node.js, we'll use a **hybrid deployment**:
- **Backend**: Deploy to a free Node.js hosting service (Railway, Render, or Fly.io)
- **Frontend**: Deploy static files to Hostinger

---

## Part 1: Deploy Backend to Node.js Hosting

### Option A: Railway (Recommended - Easiest)

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Project**:
   - Railway will auto-detect Node.js
   - Set **Root Directory** to `backend`
   - Add these environment variables in the Variables tab:
     ```
     PORT=5000
     NODE_ENV=production
     JWT_SECRET=<generate-a-secure-random-secret>
     ```
   
   **Generate JWT Secret** (run locally):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Deploy**:
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Copy your app URL (e.g., `https://your-app-name.railway.app`)

5. **Initialize Database**:
   - Go to your project → Deployments → Latest deployment
   - Click "View Logs" → Open "Shell"
   - Run:
     ```bash
     cd backend
     node database/init.js
     node scripts/import-questions.js
     ```

6. **Get Your Backend URL**:
   - Your backend will be at: `https://your-app-name.railway.app`
   - Test it: Visit `https://your-app-name.railway.app/api/health`
   - **Save this URL** - you'll need it for the frontend!

---

### Option B: Render

1. **Sign up**: Go to [render.com](https://render.com) and sign up

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `sensebait-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Add Environment Variables**:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<your-secure-secret>
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment
   - Your backend URL: `https://sensebait-backend.onrender.com`

5. **Initialize Database**:
   - Use Render's Shell (in your service dashboard)
   - Run:
     ```bash
     node database/init.js
     node scripts/import-questions.js
     ```

---

### Option C: Fly.io

1. **Install Fly CLI**: Follow [fly.io/docs](https://fly.io/docs/getting-started/installing-flyctl/)

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create App**:
   ```bash
   cd backend
   fly launch
   ```

4. **Configure**:
   - Create `fly.toml` in backend folder:
     ```toml
     app = "sensebait-backend"
     primary_region = "iad"
     
     [build]
     
     [env]
       PORT = "5000"
       NODE_ENV = "production"
     
     [[services]]
       http_checks = []
       internal_port = 5000
       processes = ["app"]
       protocol = "tcp"
       script_checks = []
     
       [services.concurrency]
         hard_limit = 25
         soft_limit = 20
         type = "connections"
     
       [[services.ports]]
         force_https = true
         handlers = ["http"]
         port = 80
     
       [[services.ports]]
         handlers = ["tls", "http"]
         port = 443
     
       [[services.tcp_checks]]
         grace_period = "1s"
         interval = "15s"
         restart_limit = 0
         timeout = "2s"
     ```

5. **Set Secrets**:
   ```bash
   fly secrets set JWT_SECRET=<your-secure-secret>
   ```

6. **Deploy**:
   ```bash
   fly deploy
   ```

---

## Part 2: Deploy Frontend to Hostinger

### Step 1: Build Frontend Locally

1. **Update API URL** (if needed):
   - Create `.env` file in `frontend` folder:
     ```
     REACT_APP_API_URL=https://your-backend-url.railway.app
     ```
   - Replace with your actual backend URL from Part 1

2. **Build the React app**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   
   This creates a `build` folder with production-ready files.

### Step 2: Upload to Hostinger

1. **Access Hostinger File Manager**:
   - Log in to Hostinger hPanel
   - Go to "File Manager"
   - Navigate to `public_html` folder

2. **Upload Files**:
   - **Option A**: Upload via File Manager
     - Delete any default files in `public_html`
     - Upload **all contents** of `frontend/build` folder to `public_html`
     - Make sure `index.html` is directly in `public_html`
   
   - **Option B**: Upload via FTP
     - Use FTP client (FileZilla, WinSCP)
     - Connect to your Hostinger FTP
     - Upload all contents of `frontend/build` to `public_html`

3. **Verify Upload**:
   - Your `public_html` should contain:
     ```
     public_html/
     ├── index.html
     ├── static/
     │   ├── css/
     │   ├── js/
     │   └── media/
     └── ...other files
     ```

### Step 3: Configure Domain

1. **In Hostinger hPanel**:
   - Go to "Domains" → "Manage"
   - Ensure `sensebait.pro` is connected
   - Enable SSL certificate (Let's Encrypt - usually auto-enabled)

2. **Test Your Site**:
   - Visit `https://sensebait.pro`
   - The React app should load

---

## Part 3: Final Configuration

### Update Frontend Build with Backend URL

If you didn't set `REACT_APP_API_URL` before building, you have two options:

**Option 1: Rebuild with Environment Variable** (Recommended)
```bash
cd frontend
# Create .env file with your backend URL
echo "REACT_APP_API_URL=https://your-backend-url.railway.app" > .env
npm run build
# Upload the new build folder contents
```

**Option 2: Manual Edit** (Quick fix)
- After uploading, edit `public_html/static/js/main.*.js`
- Find `localhost:5000` and replace with your backend URL
- **Note**: This will be overwritten on next build

### Verify Backend CORS

Your backend should already be configured to allow `sensebait.pro`. Verify in `backend/server.js`:
```javascript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://sensebait.pro', 'https://www.sensebait.pro'] 
  : ['http://localhost:3000'],
```

---

## Part 4: Testing

1. **Test Frontend**:
   - Visit `https://sensebait.pro`
   - Check browser console (F12) for errors
   - Verify API calls are going to your backend URL

2. **Test Backend**:
   - Visit `https://your-backend-url.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

3. **Test Full Flow**:
   - Register a new account
   - Login
   - Navigate through modules
   - Take a quiz

---

## Troubleshooting

### Frontend Issues

**Problem**: White screen / 404 errors
- **Solution**: Ensure `index.html` is in `public_html` root
- Check that all files from `build` folder were uploaded

**Problem**: API calls failing / CORS errors
- **Solution**: 
  1. Verify backend URL in frontend `.env` is correct
  2. Check backend CORS allows `sensebait.pro`
  3. Rebuild frontend with correct `REACT_APP_API_URL`

**Problem**: Routes not working (404 on refresh)
- **Solution**: Create `.htaccess` in `public_html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Backend Issues

**Problem**: Database errors
- **Solution**: Run initialization scripts in Railway/Render shell:
  ```bash
  node database/init.js
  node scripts/import-questions.js
  ```

**Problem**: Backend not starting
- **Solution**: Check logs in Railway/Render dashboard
- Verify all environment variables are set
- Ensure `PORT` matches service requirements

**Problem**: CORS errors
- **Solution**: Verify backend `server.js` has correct origin:
  ```javascript
  origin: ['https://sensebait.pro', 'https://www.sensebait.pro']
  ```

---

## Maintenance

### Updating the Frontend

1. Make changes to your code
2. Rebuild:
   ```bash
   cd frontend
   npm run build
   ```
3. Upload new `build` folder contents to Hostinger `public_html`

### Updating the Backend

- Railway/Render will auto-deploy on git push
- Or manually trigger deployment in dashboard

### Database Backups

- SQLite database is stored in `backend/database/learning_app.db`
- Download via Railway/Render file system or shell
- Keep regular backups

---

## Cost Summary

- **Hostinger Single Web Hosting**: Already paid
- **Railway**: Free tier (500 hours/month, $5 credit)
- **Render**: Free tier (sleeps after 15min inactivity)
- **Fly.io**: Free tier (3 shared VMs)

**Recommendation**: Start with Railway (most reliable free tier)

---

## Quick Reference

### Backend URL Format
- Railway: `https://your-app-name.railway.app`
- Render: `https://your-app-name.onrender.com`
- Fly.io: `https://your-app-name.fly.dev`

### Frontend Environment Variable
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### Backend Environment Variables
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=<your-secure-secret>
```

---

## Need Help?

If you encounter issues:
1. Check browser console (F12) for frontend errors
2. Check backend logs in Railway/Render dashboard
3. Verify all URLs and environment variables are correct
4. Ensure SSL certificates are active on both domains

Good luck with your deployment! 🚀

