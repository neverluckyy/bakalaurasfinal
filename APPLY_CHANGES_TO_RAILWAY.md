# 🚀 Apply Changes to Railway - Split Key Concepts

## ⚠️ Important: Database Changes Don't Sync Automatically

When you push code to GitHub, it only updates the **application code**, NOT the database. You must run the update script on Railway to apply database changes.

---

## 📋 Quick Steps to Apply Changes

### Step 1: Access Railway Shell

1. Go to **https://railway.app**
2. Log in to your account
3. Click on your **backend project**
4. Click on your **backend service** (shows "Node" or your app name)
5. Click the **"Shell"** button/tab at the top

**Alternative:** Go to **Deployments** → Click latest deployment → Click **"Shell"** button

### Step 2: Run the Update Script

In the Railway Shell terminal, type:

```bash
cd backend
```

Press Enter. Then type:

```bash
node scripts/apply-all-changes-railway.js
```

Press Enter.

### Step 3: Wait for Completion

You should see output like:

```
================================================================================
Applying All Changes to Railway Database
================================================================================
Found section ID: 1

STEP 1: Removing references from Introduction page...
✓ Removed references from Introduction page

STEP 2: Splitting Key Concepts into separate pages...
Inserting individual concept pages...
  ✓ Created page 1: "Understanding social engineering tactics..."
  ✓ Created page 2: "Phishing (email): "the inbox trap""
  ✓ Created page 3: "Vishing (voice): "the convincing caller""
  ✓ Created page 4: "Smishing (SMS/text): "fast taps, big consequences""
  ✓ Created page 5: "Pretexting: "the believable story""
  ✓ Created page 6: "Baiting: "free stuff that costs you""
  ✓ Created page 7: "Tailgating (physical): "the door-hold exploit""
  ✓ Created page 8: "Wrap-up checklist (Stop. Verify. Report.)"

✓ Successfully created 8 separate concept pages

================================================================================
✅ ALL CHANGES APPLIED SUCCESSFULLY!
================================================================================
```

### Step 4: Verify on Website

1. **Clear your browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Or open in Incognito/Private mode**
3. Visit your learning section
4. You should now see:
   - ✅ Introduction page **without references**
   - ✅ **8 separate concept pages** instead of one combined "Key Concepts" page

---

## 🔍 Troubleshooting

### Issue: Script not found

**Error:** `Cannot find module 'scripts/apply-all-changes-railway.js'`

**Solution:**
1. Make sure Railway has pulled the latest code (wait 1-2 minutes after git push)
2. Check you're in the backend directory: `pwd` (should show `/app/backend`)
3. List files: `ls scripts/` (should show `apply-all-changes-railway.js`)
4. If file not found, Railway may need to redeploy - check the Deployments tab

### Issue: Still seeing combined Key Concepts page

**Solution:**
1. **Hard refresh browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Clear browser cache completely**
3. **Try incognito/private mode**
4. **Wait 1-2 minutes** for changes to propagate
5. Check Railway logs for any errors

### Issue: Database locked error

**Error:** `SQLITE_BUSY: database is locked`

**Solution:**
- Wait 30 seconds and try again
- The database might be in use by the running server
- If persists, restart the Railway service

---

## ✅ Verification Commands

After running the script, you can verify the changes:

```bash
cd backend
node scripts/check-current-content.js
```

This will show all learning content pages and confirm they're split correctly.

---

## 📝 What the Script Does

1. **Removes references** from the Introduction page
2. **Deletes** the old combined "Key Concepts" page
3. **Creates 8 separate pages**, one for each concept:
   - Understanding social engineering tactics
   - Phishing (email)
   - Vishing (voice)
   - Smishing (SMS/text)
   - Pretexting
   - Baiting
   - Tailgating (physical)
   - Wrap-up checklist

Each page includes its own content, activity prompts, and references.

---

## 🎯 Quick Command Reference

```bash
# Apply all changes (removes intro refs + splits concepts)
cd backend && node scripts/apply-all-changes-railway.js

# Check current content structure
cd backend && node scripts/check-current-content.js

# Verify content exists
cd backend && node scripts/check-module1-section1.js
```

---

**Once you run the script on Railway, the changes will appear on your live website!**

