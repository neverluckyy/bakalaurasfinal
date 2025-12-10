# 🚀 Update Learning Content on Railway - Quick Guide

## Step-by-Step Instructions

### Step 1: Open Railway Shell

1. Go to **https://railway.app**
2. Click on your **backend project**
3. Go to **Deployments** tab
4. Click on the **latest deployment**
5. Click **"Shell"** button (or look for "Open Shell" / "Terminal")

### Step 2: Run the Update Script

Once the shell opens, run these commands:

```bash
cd backend
node scripts/nuclear-update-learning-content.js
```

### Step 3: Wait for Completion

You should see output like:
```
================================================================================
NUCLEAR UPDATE: Complete Learning Content Rebuild
================================================================================
✓ Found section ID: 1
✓ Deleted all existing content
✓ Inserted Introduction (ID: ...)
✓ Inserted Key Concepts (ID: ...)
✅ NUCLEAR UPDATE COMPLETED SUCCESSFULLY!
================================================================================
```

### Step 4: Verify the Update

1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Or open in Incognito/Private mode**
3. Visit: `https://sensebait.pro/sections/1/learn`
4. You should see the new Introduction starting with:
   > "Welcome to the **Phishing and Social Engineering** section!"

### Troubleshooting

**If the script doesn't run:**
- Make sure you're in the `backend` directory
- Check that the file exists: `ls scripts/nuclear-update-learning-content.js`
- If file not found, Railway might need to redeploy to get the latest code

**If you still see old content:**
- Clear browser cache completely
- Try incognito/private mode
- Wait 1-2 minutes for Railway to restart
- Check Railway logs for any errors

---

## Alternative: Run Diagnostic First

If you want to check what's currently in the database before updating:

```bash
cd backend
node scripts/diagnose-learning-content.js
```

This will show you:
- What content currently exists
- Whether it's old or new version
- What needs to be updated

