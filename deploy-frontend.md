# Quick Frontend Deployment Steps

## 🚀 Option 1: Deploy to Netlify (Recommended)

### Prerequisites
- Backend deployed (Railway, Render, etc.)
- Backend URL ready
- GitHub repository with your code

### Steps

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Sign up/login with GitHub

2. **Deploy:**
   - Click "Add new site" → "Import an existing project"
   - Choose your GitHub repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Set Environment Variable:**
   - In Netlify dashboard: Site settings → Environment variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.railway.app`
   - Replace with your actual backend URL

4. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete

5. **Done!** Your site will be live at `https://your-site.netlify.app`

**📖 For detailed instructions, see `NETLIFY_DEPLOYMENT.md`**

---

## 📤 Option 2: Deploy to Hostinger

### Before Building

1. **Set your backend URL** in `frontend/.env`:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
   (Replace with your actual backend URL)

### Build Command

```bash
cd frontend
npm run build
```

### Upload to Hostinger

Upload **all contents** of `frontend/build` folder to `public_html` in Hostinger File Manager.

Also upload `.htaccess` file (from project root) to `public_html`.

