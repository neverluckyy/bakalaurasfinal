# Railway Quick Start - sensebait.pro Deployment

## 🚀 Quick Steps

### 1. Generate JWT Secret
```bash
node generate-jwt-secret.js
```
Copy the output - you'll need it for Railway.

### 2. Push to GitHub (if not done)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3. Deploy to Railway

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Settings** → **Root Directory** = `backend`
6. **Variables** tab → Add:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `<paste-from-step-1>`
7. **Wait for deployment** (2-3 minutes)
8. **Get your URL** from Settings → Domains
9. **Test:** Visit `https://your-app.railway.app/api/health`

### 4. Initialize Database

In Railway dashboard:
- **Deployments** → **Latest** → **View Logs** → **Shell**
- Run:
  ```bash
  cd backend
  node database/init.js
  node scripts/import-questions.js
  ```

### 5. Prepare Frontend

```bash
# Create .env file
echo "REACT_APP_API_URL=https://your-app.railway.app" > frontend/.env
# (Replace with your actual Railway URL)

# Build
cd frontend
npm install
npm run build
```

### 6. Upload to Hostinger

1. **hPanel** → **File Manager** → `public_html`
2. **Upload** all contents from `frontend/build`
3. **Upload** `.htaccess` file
4. **Enable SSL** for sensebait.pro

### 7. Test!

Visit `https://sensebait.pro` 🎉

---

## 📋 What You Need

- [ ] GitHub repository URL
- [ ] Railway account (create at railway.app)
- [ ] Hostinger hPanel access
- [ ] Backend URL (from Railway after deployment)

---

## ⚡ One-Liner Commands

```bash
# Generate JWT secret
node generate-jwt-secret.js

# Prepare frontend (after you have backend URL)
echo "REACT_APP_API_URL=https://YOUR_RAILWAY_URL.railway.app" > frontend/.env
cd frontend && npm install && npm run build
```

---

See **RAILWAY_DEPLOYMENT_GUIDE.md** for detailed instructions!

