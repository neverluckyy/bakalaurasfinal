# Hostinger Deployment Checklist for sensebait.pro

## 📋 Information I Need From You

Before we start, please provide the following:

### 1. **Hostinger Account Access**
- [ ] Hostinger hPanel login credentials (or you'll do this yourself)
- [ ] FTP credentials (if you prefer FTP over File Manager)
  - FTP Host: Usually `ftp.sensebait.pro` or similar
  - FTP Username: (from Hostinger)
  - FTP Password: (from Hostinger)

### 2. **Backend Hosting Choice**
Choose ONE option for backend hosting:
- [ ] **Railway** (Recommended - easiest, free tier available)
- [ ] **Render** (Alternative - free tier, sleeps after inactivity)
- [ ] **Fly.io** (Alternative - more complex setup)

### 3. **GitHub Repository** (if using Railway/Render)
- [ ] Is your code in a GitHub repository?
- [ ] Repository URL: _________________________
- [ ] If not, we'll need to create one or use manual deployment

---

## 🚀 Step-by-Step Deployment Process

### Phase 1: Backend Deployment (Node.js Hosting)

#### Option A: Railway (Recommended)

**What you need to do:**
1. [ ] Go to https://railway.app
2. [ ] Sign up with GitHub account
3. [ ] Click "New Project" → "Deploy from GitHub repo"
4. [ ] Select your repository
5. [ ] In project settings:
   - Set **Root Directory** to: `backend`
   - Go to **Variables** tab
   - Add these environment variables:
     ```
     PORT=5000
     NODE_ENV=production
     JWT_SECRET=<I'll help you generate this>
     ```
6. [ ] Wait for deployment (2-3 minutes)
7. [ ] Copy your backend URL (e.g., `https://your-app-name.railway.app`)
8. [ ] Test backend: Visit `https://your-app-name.railway.app/api/health`
9. [ ] Initialize database:
   - Go to project → Latest deployment → "View Logs" → "Shell"
   - Run:
     ```bash
     cd backend
     node database/init.js
     node scripts/import-questions.js
     ```

**Information to provide:**
- [ ] Backend URL: `https://________________________.railway.app`

---

#### Option B: Render

**What you need to do:**
1. [ ] Go to https://render.com
2. [ ] Sign up with GitHub account
3. [ ] Click "New +" → "Web Service"
4. [ ] Connect your repository
5. [ ] Configure:
   - **Name**: `sensebait-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. [ ] Add Environment Variables:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<I'll help you generate this>
   ```
7. [ ] Click "Create Web Service"
8. [ ] Wait for deployment
9. [ ] Copy your backend URL (e.g., `https://sensebait-backend.onrender.com`)
10. [ ] Initialize database:
    - Go to service → "Shell" tab
    - Run:
      ```bash
      node database/init.js
      node scripts/import-questions.js
      ```

**Information to provide:**
- [ ] Backend URL: `https://________________________.onrender.com`

---

### Phase 2: Frontend Build & Configuration

**What I'll help you with:**
1. [ ] Generate JWT_SECRET for backend
2. [ ] Create `frontend/.env` file with your backend URL
3. [ ] Build the React frontend
4. [ ] Prepare files for upload

**Commands I'll run:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Build frontend
cd frontend
npm install
npm run build
```

**Files created:**
- `frontend/build/` folder (contains all production files)
- `frontend/.env` file (with backend URL)

---

### Phase 3: Upload to Hostinger

**What you need to do:**
1. [ ] Log in to Hostinger hPanel
2. [ ] Open **File Manager**
3. [ ] Navigate to `public_html` folder
4. [ ] Delete any default files (like default `index.html`)
5. [ ] Upload **ALL contents** from `frontend/build` folder to `public_html`
   - Make sure `index.html` is directly in `public_html` root
   - Upload the entire `static` folder
6. [ ] Upload `.htaccess` file (from project root) to `public_html`
7. [ ] Verify file structure:
   ```
   public_html/
   ├── index.html
   ├── static/
   │   ├── css/
   │   ├── js/
   │   └── media/
   ├── .htaccess
   └── (other files from build folder)
   ```

**Alternative: FTP Upload**
If you prefer FTP:
1. [ ] Use FTP client (FileZilla, WinSCP, etc.)
2. [ ] Connect using Hostinger FTP credentials
3. [ ] Upload all contents of `frontend/build` to `public_html`
4. [ ] Upload `.htaccess` file

---

### Phase 4: Domain & SSL Configuration

**What you need to do:**
1. [ ] In Hostinger hPanel, go to **Domains** → **Manage**
2. [ ] Ensure `sensebait.pro` is connected to your hosting
3. [ ] Go to **SSL** section
4. [ ] Enable SSL certificate (Let's Encrypt - usually auto-enabled)
5. [ ] Verify SSL is active (should show green/active status)

---

### Phase 5: Final Testing

**What to test:**
1. [ ] Visit `https://sensebait.pro` - should load the app
2. [ ] Open browser console (F12) - check for errors
3. [ ] Test registration - create a new account
4. [ ] Test login - log in with your account
5. [ ] Test navigation - browse modules
6. [ ] Test quiz - take a quiz
7. [ ] Test API connection - verify API calls go to your backend URL

**Backend health check:**
- [ ] Visit `https://your-backend-url.railway.app/api/health`
- [ ] Should return: `{"status":"OK","timestamp":"..."}`

---

## 🔧 Troubleshooting

### Frontend Issues

**White screen / 404 errors:**
- ✅ Check that `index.html` is in `public_html` root
- ✅ Verify `.htaccess` file is uploaded
- ✅ Check browser console (F12) for errors

**API calls failing / CORS errors:**
- ✅ Verify `REACT_APP_API_URL` in frontend `.env` matches your backend URL
- ✅ Check backend CORS allows `sensebait.pro` (already configured in code)
- ✅ Rebuild frontend if you changed `.env`

**Routes not working (404 on refresh):**
- ✅ Ensure `.htaccess` file is in `public_html`
- ✅ Verify mod_rewrite is enabled on Hostinger (usually is)

### Backend Issues

**Database errors:**
- ✅ Run initialization scripts in Railway/Render shell:
  ```bash
  node database/init.js
  node scripts/import-questions.js
  ```

**Backend not starting:**
- ✅ Check logs in Railway/Render dashboard
- ✅ Verify all environment variables are set
- ✅ Ensure `PORT` matches service requirements

**CORS errors:**
- ✅ Backend is already configured for `sensebait.pro` in `backend/server.js`
- ✅ Verify backend URL is correct

---

## 📝 Quick Reference

### Backend URLs
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
JWT_SECRET=<generated-secret>
```

---

## ✅ Final Checklist

Before going live:
- [ ] Backend deployed and running
- [ ] Backend URL tested (`/api/health` works)
- [ ] Database initialized
- [ ] Frontend built with correct backend URL
- [ ] All files uploaded to Hostinger `public_html`
- [ ] `.htaccess` file uploaded
- [ ] SSL certificate enabled on `sensebait.pro`
- [ ] Frontend loads at `https://sensebait.pro`
- [ ] Registration works
- [ ] Login works
- [ ] Navigation works
- [ ] Quiz functionality works
- [ ] No console errors

---

## 🆘 Need Help?

If you encounter issues:
1. Check browser console (F12) for frontend errors
2. Check backend logs in Railway/Render dashboard
3. Verify all URLs and environment variables are correct
4. Ensure SSL certificates are active on both domains
5. Test backend health endpoint directly

---

## 📞 Next Steps

**Please provide:**
1. Your choice of backend hosting (Railway/Render/Fly.io)
2. GitHub repository URL (if using Railway/Render)
3. Hostinger FTP credentials (optional - if you prefer FTP)
4. Any specific questions or concerns

Once you provide this information, I'll:
- Generate the JWT_SECRET
- Create the frontend `.env` file
- Build the frontend
- Guide you through the upload process
- Help troubleshoot any issues

Let's get your app live on sensebait.pro! 🚀

