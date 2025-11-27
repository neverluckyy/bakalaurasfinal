# 🚀 Simple Deployment Checklist

## What You're Doing
- **Backend** → Railway (free Node.js hosting)
- **Frontend** → Hostinger (your sensebait.pro domain)

---

## ✅ Step-by-Step Checklist

### 1️⃣ Deploy Backend (Railway)
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Create new project from your GitHub repo
- [ ] Set Root Directory to: `backend`
- [ ] Add 3 environment variables:
  - [ ] `PORT` = `5000`
  - [ ] `NODE_ENV` = `production`
  - [ ] `JWT_SECRET` = (generate with command below)
- [ ] Wait for deployment
- [ ] Copy your Railway URL (save it!)
- [ ] Test: Visit `https://your-url.railway.app/api/health`

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2️⃣ Setup Database
- [ ] Open Railway Shell (in your project)
- [ ] Run: `cd backend`
- [ ] Run: `node database/init.js`
- [ ] Run: `node scripts/import-questions.js`

### 3️⃣ Build Frontend
- [ ] Create `frontend/.env` file with:
  ```
  REACT_APP_API_URL=https://your-railway-url.railway.app
  ```
- [ ] Run: `cd frontend`
- [ ] Run: `npm install` (if needed)
- [ ] Run: `npm run build`
- [ ] Wait for build to finish

### 4️⃣ Upload to Hostinger
- [ ] Log in to Hostinger hPanel
- [ ] Open File Manager
- [ ] Go to `public_html` folder
- [ ] Upload ALL files from `frontend/build` folder
- [ ] Upload `.htaccess` file (from project root)
- [ ] Make sure `index.html` is in `public_html` root

### 5️⃣ Test
- [ ] Visit https://sensebait.pro
- [ ] Check browser console (F12) for errors
- [ ] Try registering an account
- [ ] Try logging in

---

## 🆘 Stuck? Here's Help:

### "I don't know how to do Step 1"
→ Open `STEP_BY_STEP_GUIDE.md` - it has detailed instructions with explanations

### "Railway is confusing"
→ See "PART 1" in `STEP_BY_STEP_GUIDE.md` for Railway-specific help

### "Build failed"
→ Check terminal for error messages
→ Make sure you're in the `frontend` folder
→ Try: `npm install` first, then `npm run build`

### "Upload failed"
→ Use File Manager in Hostinger (easiest)
→ Or use FTP client like FileZilla
→ Make sure you upload CONTENTS of `build` folder, not the folder itself

### "Site shows white screen"
→ Check that `index.html` is in `public_html` root
→ Check that `.htaccess` is uploaded
→ Open browser console (F12) to see errors

### "API not working"
→ Check `frontend/.env` has correct Railway URL
→ Rebuild frontend: `npm run build`
→ Re-upload build files

---

## 📚 Full Guides Available:

1. **SIMPLE_CHECKLIST.md** ← You are here (quick reference)
2. **STEP_BY_STEP_GUIDE.md** ← Detailed instructions for each step
3. **QUICK_START_DEPLOYMENT.md** ← Quick overview
4. **DEPLOYMENT_GUIDE.md** ← Complete guide with all options

---

## 💡 Pro Tips:

- **Save your Railway URL** - you'll need it for the frontend `.env` file
- **Test backend first** - make sure `https://your-url.railway.app/api/health` works
- **Check browser console** - it shows what's wrong (F12 → Console tab)
- **Take it one step at a time** - don't rush!

---

## 🎯 Current Status?

Tell me which step you're on and I'll help you with that specific part!

- "I'm on Step 1" → I'll help with Railway
- "I'm on Step 3" → I'll help with building
- "I'm stuck on..." → Tell me what's happening

Good luck! 🚀

