# 🚀 Complete Guide: Update Content on Railway (Step-by-Step)

## 📋 What You Need

- ✅ Railway account access
- ✅ Your project deployed on Railway
- ✅ 5-10 minutes

---

## 🎯 Quick Method (Recommended)

### **Just run this ONE command in Railway Shell:**

```bash
cd backend && node scripts/update-railway-simple.js
```

That's it! The script will:
1. ✅ Check current database state
2. ✅ Update the learning content
3. ✅ Verify the update worked
4. ✅ Show you next steps

---

## 📝 Detailed Step-by-Step Instructions

### **Step 1: Access Railway Dashboard**

1. Open your web browser
2. Go to: **https://railway.app**
3. Log in to your Railway account

### **Step 2: Open Your Project**

1. In Railway dashboard, find and click on **your project**
   - It will have a name like "bakalauras" or "social-engineering-app"
   - Or look for the project with your backend service

### **Step 3: Open Railway Shell**

**Option A: From Service View**
1. Click on your **backend service** (usually shows "Node" or has your app name)
2. Look for a **"Shell"** button/tab at the top
3. Click **"Shell"**

**Option B: From Deployments**
1. Click on **"Deployments"** in the left sidebar
2. Click on the **latest deployment** (most recent one)
3. Click **"Shell"** button

**Option C: Using Three Dots Menu**
1. Click the **three dots (⋮)** next to your service
2. Select **"Shell"** or **"Open Shell"**

You should now see a terminal/command prompt.

### **Step 4: Run the Update Script**

In the Railway Shell terminal, type:

```bash
cd backend
```

Press Enter. Then type:

```bash
node scripts/update-railway-simple.js
```

Press Enter.

### **Step 5: Wait for Completion**

The script will show:
- ✅ Database initialization
- ✅ Current content check
- ✅ Updating content...
- ✅ Verification

**Expected output:**
```
============================================================
RAILWAY CONTENT UPDATE - AUTOMATED
============================================================

Step 1: Initializing database...
✓ Database initialized

Step 2: Checking current content...
✓ Found section: Security Awareness Essentials > Phishing and Social Engineering (ID: 1)
✓ Current content items: X

Step 3: Updating learning content...
────────────────────────────────────────────────────────────
Starting update for Module 1 Section 1...
Database initialized successfully
Found section ID: 1
...
✓ Updated Introduction page
✓ Updated Key Concepts page
Update completed successfully!

Step 4: Verifying update...
✓ Total content items after update: X
✓ Introduction: ✓ EXISTS
✓ Key Concepts: ✓ EXISTS

============================================================
✅ SUCCESS! Content has been updated on Railway
============================================================

📋 Next steps:
  1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
  2. Visit your production website
  3. Navigate to: Learn → Security Awareness Essentials → Phishing and Social Engineering
  4. Verify the new content appears
```

### **Step 6: Verify on Your Website**

1. **Open your production website** (e.g., https://sensebait.pro)
2. **Clear browser cache:**
   - **Windows/Linux:** Press `Ctrl + Shift + R`
   - **Mac:** Press `Cmd + Shift + R`
   - Or open in **Incognito/Private mode**

3. **Navigate to the learning section:**
   - Click **"Learn"** or **"Modules"**
   - Click **"Security Awareness Essentials"**
   - Click **"Phishing and Social Engineering"**
   - Click **"Start Learning"** or **"Continue Learning"**

4. **Verify new content:**
   - ✅ You should see an updated Introduction page
   - ✅ Key Concepts should have detailed paragraphs about each attack type
   - ✅ Content should match what you see locally

---

## 🛠️ Alternative Methods

### **Method 2: Using Diagnostic + Update**

If you want to check first, then update:

```bash
cd backend

# Step 1: Check current state
node scripts/check-module1-section1.js

# Step 2: Update
node scripts/update-module1-section1-embedded.js

# Step 3: Verify
node scripts/check-module1-section1.js
```

### **Method 3: Using Bash Script**

If the simple script doesn't work, use the bash version:

```bash
cd backend
bash scripts/update-railway-content.sh
```

---

## ❌ Troubleshooting

### **Issue: "command not found: node"**

**Solution:**
```bash
# Make sure you're in the right directory
pwd  # Should show something like /app/backend

# Try full path
which node  # Find node location
/usr/local/bin/node scripts/update-railway-simple.js
```

### **Issue: "Cannot find module"**

**Solution:**
```bash
# Make sure you're in backend directory
cd backend

# Check if node_modules exists
ls node_modules | head -5

# If missing, install dependencies (shouldn't be needed but just in case)
npm install
```

### **Issue: "Section not found"**

**Solution:**
The section might have a different ID. Run diagnostic:
```bash
cd backend
node scripts/diagnose-learning-content.js
```

This will show all available sections and their IDs.

### **Issue: Script runs but content doesn't appear**

**Possible causes:**

1. **Browser cache** - Clear it completely:
   - DevTools (F12) → Application → Clear storage → Clear site data

2. **API not updated** - Check in browser DevTools:
   - Network tab → Find `/api/learning-content/section/1`
   - Check if response has new content

3. **Database not persisting** - Railway might be using ephemeral storage:
   - Check: Railway Dashboard → Settings → Volumes
   - If no volumes, database resets on deployment
   - Solution: Configure persistent storage

### **Issue: "Permission denied" or "Database locked"**

**Solution:**
- Wait 30 seconds and try again
- The database might be in use by the running server
- If persists, restart the Railway service

---

## 📸 Visual Guide

### Finding Railway Shell:

```
Railway Dashboard
└── Your Project
    ├── Services
    │   └── Backend Service → [Shell Button]
    └── Deployments
        └── Latest Deployment → [Shell Button]
```

### Terminal After Opening Shell:

```
railway@railway:~/app$ 
```

Type: `cd backend` then press Enter

```
railway@railway:~/app/backend$ 
```

Type: `node scripts/update-railway-simple.js` then press Enter

---

## ✅ Success Checklist

After running the script, verify:

- [ ] Script output shows "✅ SUCCESS! Content has been updated"
- [ ] Introduction shows as "✓ EXISTS"
- [ ] Key Concepts shows as "✓ EXISTS"
- [ ] Browser cache cleared
- [ ] Website shows new content
- [ ] No errors in Railway logs

---

## 🆘 Still Need Help?

If you encounter any issues:

1. **Copy the full output** from the Railway Shell
2. **Check Railway logs** for errors:
   - Railway Dashboard → Your Service → Logs
3. **Verify environment:**
   - Railway Dashboard → Variables
   - Make sure all required environment variables are set

---

## 📞 Quick Reference Commands

```bash
# One-command update (RECOMMENDED)
cd backend && node scripts/update-railway-simple.js

# Check current state
cd backend && node scripts/check-module1-section1.js

# Full diagnostic
cd backend && node scripts/diagnose-learning-content.js

# Manual update
cd backend && node scripts/update-module1-section1-embedded.js
```

---

## 🎉 Done!

Once you see the success message and verify on your website, you're all set! The content is now live on Railway.

