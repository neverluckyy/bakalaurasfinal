# Quick Start: Deploy to sensebait.pro

## What You Need to Do (Step-by-Step)

### ✅ Step 1: Deploy Backend to Free Node.js Hosting

**Choose ONE option:**

#### Option A: Railway (Easiest - Recommended)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. In project settings:
   - Set **Root Directory** to: `backend`
   - Go to **Variables** tab, add:
     ```
     PORT = 5000
     NODE_ENV = production
     JWT_SECRET = <generate a random secret>
     ```
6. Wait for deployment (2-3 minutes)
7. **Copy your backend URL** (looks like: `https://your-app-name.railway.app`)
8. Test it: Visit `https://your-app-name.railway.app/api/health` (should show JSON)

**Generate JWT_SECRET** (run this locally):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Option B: Render (Alternative)
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `sensebait-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<your-secret>
   ```
7. Click "Create Web Service"
8. **Copy your backend URL** (looks like: `https://sensebait-backend.onrender.com`)

---

### ✅ Step 2: Initialize Database

After backend is deployed:

**In Railway:**
- Go to your project → Latest deployment → "View Logs" → "Shell"
- Run:
  ```bash
  cd backend
  node database/init.js
  node scripts/import-questions.js
  ```

**In Render:**
- Go to your service → "Shell" tab
- Run the same commands

---

### ✅ Step 3: Build Frontend

On your local computer:

1. **Create environment file:**
   ```bash
   cd frontend
   ```
   Create a file named `.env` with:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
   (Replace with your actual backend URL from Step 1)

2. **Build the app:**
   ```bash
   npm install
   npm run build
   ```
   
   This creates a `build` folder with production files.

---

### ✅ Step 4: Upload to Hostinger

1. **Log in to Hostinger hPanel**
2. **Open File Manager**
3. **Navigate to `public_html` folder**
4. **Delete any default files** (like index.html, if present)
5. **Upload files:**
   - Upload **ALL contents** from `frontend/build` folder
   - Make sure `index.html` goes directly into `public_html`
   - Also upload `.htaccess` file (from project root) to `public_html`
6. **Verify structure:**
   ```
   public_html/
   ├── index.html
   ├── static/
   │   ├── css/
   │   ├── js/
   │   └── media/
   └── .htaccess
   ```

---

### ✅ Step 5: Configure Domain & SSL

1. **In Hostinger hPanel:**
   - Go to "Domains" → "Manage"
   - Ensure `sensebait.pro` is connected
   - Enable SSL certificate (usually auto-enabled, check "SSL" section)

2. **Test your site:**
   - Visit `https://sensebait.pro`
   - Should see your app!

---

### ✅ Step 6: Test Everything

1. **Open browser console** (F12)
2. **Check for errors** (should be none)
3. **Test registration:**
   - Create a new account
   - Login
   - Navigate through modules
   - Take a quiz

---

## Troubleshooting

### Frontend shows white screen?
- Check that `index.html` is in `public_html` root
- Verify `.htaccess` file is uploaded
- Check browser console for errors

### API calls failing?
- Verify `REACT_APP_API_URL` in frontend `.env` matches your backend URL
- Check backend CORS allows `sensebait.pro` (already configured)
- Rebuild frontend if you changed `.env`

### Backend not working?
- Check Railway/Render logs
- Verify environment variables are set
- Test backend URL directly: `https://your-backend-url.railway.app/api/health`

---

## Summary Checklist

- [ ] Deploy backend to Railway/Render
- [ ] Get backend URL
- [ ] Initialize database (run init scripts)
- [ ] Create `frontend/.env` with backend URL
- [ ] Build frontend (`npm run build`)
- [ ] Upload `build` folder contents to Hostinger `public_html`
- [ ] Upload `.htaccess` to `public_html`
- [ ] Enable SSL on sensebait.pro
- [ ] Test the website!

---

## Need Help?

- **Backend URL format:**
  - Railway: `https://your-app-name.railway.app`
  - Render: `https://your-app-name.onrender.com`

- **Frontend .env file:**
  ```
  REACT_APP_API_URL=https://your-backend-url.railway.app
  ```

- **Full guide:** See `DEPLOYMENT_GUIDE.md` for detailed instructions

Good luck! 🚀

