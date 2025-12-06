# 🚂 Railway Quick Start

## TL;DR - Deploy in 5 Steps

1. **Push to GitHub** (if not done)
2. **Go to https://railway.app** → New Project → Deploy from GitHub
3. **Set Root Directory to `backend`** (Settings tab)
4. **Add Variables:**
   - `PORT=5000`
   - `NODE_ENV=production`
   - `JWT_SECRET=<your-secret>` (see below)
5. **Initialize DB:** Railway Shell → `node database/init.js` → `node scripts/import-questions.js`

---

## 🔑 Your JWT Secret

Run this to generate a new one:
```bash
node generate-jwt-secret.js
```

Or use this pre-generated one:
```
26943b1d5691081eaf5533f9318952db445bdc54001731085d32cc0b986c406277e1a5ff38d82ddbffb92d353427789b7fda08aa544a08938c4ec78c4954f12e
```

---

## ⚙️ Railway Settings

### Root Directory
```
backend
```

### Environment Variables
```
PORT=5000
NODE_ENV=production
JWT_SECRET=<paste-secret-here>
```

### Optional (if you have custom domain)
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🧪 Test Your Deployment

1. **Health Check:**
   ```
   https://your-app.railway.app/api/health
   ```

2. **Should return:**
   ```json
   {"status":"OK","timestamp":"..."}
   ```

---

## 📝 Database Setup

After deployment, open Railway Shell and run:
```bash
node database/init.js
node scripts/import-questions.js
```

---

## 🎨 Frontend Setup

1. **Create `frontend/.env`:**
   ```env
   VITE_API_URL=https://your-app.railway.app
   ```

2. **Build:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy `frontend/dist` to your hosting**

---

## 🆘 Common Issues

**Deployment fails?**
- Check Root Directory is set to `backend`
- Check all environment variables are set
- Check Railway logs

**Backend not responding?**
- Verify `PORT=5000` is set
- Check Railway logs
- Test `/api/health` endpoint

**Database errors?**
- Run `node database/init.js` in Railway Shell
- Check logs for SQLite errors

---

## 📚 Full Guide

See `DEPLOY_TO_RAILWAY.md` for detailed instructions.

