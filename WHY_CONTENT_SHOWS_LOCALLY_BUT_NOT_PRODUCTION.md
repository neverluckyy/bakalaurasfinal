# Why New Content Shows Locally But Not in Production

## 🔍 Root Causes

When content appears locally but not on Railway/Netlify, it's almost always because **the local and production databases are completely separate**. Here are the main reasons:

---

## 1. ⚠️ **Separate Database Instances** (MOST COMMON)

**The Problem:**
- Your **local database** is at: `backend/database/learning_app.db` (on your computer)
- Railway's **production database** is at: `backend/database/learning_app.db` (on Railway's servers)
- These are **two completely different files** that don't sync automatically

**What Happened:**
1. ✅ You ran the update script **locally** → Updated your local database
2. ❌ The update script was **NOT run on Railway** → Production database still has old/empty content
3. 🌐 Website shows production database → No new content appears

**Solution:**
You **must run the update script on Railway** as well:
```bash
# In Railway Shell:
cd backend
node scripts/update-module1-section1-embedded.js
```

---

## 2. 📁 **Database Files Are Excluded from Git/Railway**

**The Problem:**
Looking at `.railwayignore`:
```
# Exclude database files
*.db
*.db-shm
*.db-wal
*.sqlite
```

This means:
- ❌ Your local `learning_app.db` file is **NOT uploaded** to Railway
- ✅ Railway creates a **fresh database** on first deployment
- ❌ Any updates to your local database **don't affect** Railway

**Why This Design?**
- Database files can be large
- You don't want to commit user data to Git
- Each environment should have its own database

**Solution:**
This is correct behavior! Just make sure to:
1. Run update scripts on **both** local and Railway
2. Initialize Railway's database properly
3. Use Railway's persistent storage (see below)

---

## 3. 💾 **Railway Ephemeral Storage** (DATABASE RESETS)

**The Problem:**
By default, Railway uses **ephemeral storage**, which means:
- ❌ Database resets on each deployment
- ❌ Database resets on container restart
- ❌ All data is lost when Railway rebuilds

**How to Check:**
1. Go to Railway Dashboard → Your Project
2. Click **Settings** tab
3. Look for **"Persistent Storage"** or **"Volumes"** section
4. If it says "No volumes configured" → You're using ephemeral storage

**Solution:**
Configure persistent storage in Railway:
1. Railway Dashboard → Your Project → Settings
2. Scroll to **"Volumes"** or **"Persistent Storage"**
3. Click **"Add Volume"**
4. Set mount path to: `/app/backend/database`
5. This ensures the database persists across deployments

**Alternative:**
Run update scripts after each deployment (less ideal, but works):
- Set up an initialization script that runs on startup
- Or manually run the update script after each deployment

---

## 4. 🔄 **Database Initialization Only Runs Once**

**The Problem:**
Looking at `backend/database/init.js`:
- `initDatabase()` creates tables if they don't exist
- It inserts default modules and sections
- But it **doesn't populate learning content** automatically

**What This Means:**
- ✅ Railway creates the database structure
- ✅ Modules and sections are created
- ❌ Learning content is **empty** until you run the update script

**Solution:**
This is expected behavior. You need to:
1. Run the update script manually after initial deployment
2. OR configure auto-update (see `AUTO_UPDATE_LEARNING_CONTENT` in `server.js`)

---

## 5. 🚀 **Deployment Doesn't Run Update Scripts**

**The Problem:**
When you push code to Railway:
- ✅ Code is deployed
- ✅ Database structure is initialized
- ❌ Update scripts are **NOT automatically run**

**Solution:**
You must manually run update scripts in Railway Shell:
```bash
cd backend
node scripts/update-module1-section1-embedded.js
```

**Future Improvement:**
You could set `AUTO_UPDATE_LEARNING_CONTENT=true` in Railway environment variables, which will auto-update on server startup (see `server.js` lines 152-169).

---

## 6. 🌐 **Frontend Caching** (Less Likely But Possible)

**The Problem:**
Even if the database is updated, the frontend might:
- Cache API responses
- Use cached JavaScript bundles
- Store old data in localStorage

**Solution:**
1. Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear localStorage:
   - DevTools (F12) → Application → Local Storage → Clear
3. Test in Incognito/Private mode

---

## 📋 **Diagnostic Checklist**

Run through this checklist to identify the exact issue:

### Step 1: Verify Local Database Has Content
```bash
# On your local machine:
cd backend
node scripts/check-module1-section1.js
```
✅ Expected: Shows content exists and is updated

### Step 2: Verify Railway Database Has Content
```bash
# In Railway Shell:
cd backend
node scripts/check-module1-section1.js
```
❌ **If this shows no content** → This is your problem! Run the update script on Railway.

### Step 3: Check Railway Storage Persistence
1. Railway Dashboard → Your Project → Settings
2. Check if "Volumes" or "Persistent Storage" is configured
3. ❌ **If not configured** → Database resets on each deployment

### Step 4: Check API Response
1. Open production website
2. DevTools (F12) → Network tab
3. Navigate to Module 1 Section 1
4. Find request: `/api/learning-content/section/1`
5. Check response - does it have content?

### Step 5: Verify Script Was Run on Railway
Check Railway logs for:
- "✓ Updated Introduction page"
- "✓ Updated Key Concepts page"
- "Update completed successfully!"

---

## ✅ **Complete Solution**

To fix the issue permanently:

### Option A: Manual Update (Quick Fix)
1. **Connect to Railway Shell**
2. **Run the diagnostic script:**
   ```bash
   cd backend
   node scripts/check-module1-section1.js
   ```
3. **If content is missing, run the update script:**
   ```bash
   node scripts/update-module1-section1-embedded.js
   ```
4. **Verify it worked:**
   ```bash
   node scripts/check-module1-section1.js
   ```

### Option B: Persistent Storage + Auto-Update (Long-term Fix)

1. **Configure Railway Persistent Storage:**
   - Railway Dashboard → Your Project → Settings → Volumes
   - Add volume: Mount path `/app/backend/database`

2. **Enable Auto-Update:**
   - Railway Dashboard → Your Project → Variables
   - Add: `AUTO_UPDATE_LEARNING_CONTENT=true`
   - This will update content on each server restart

3. **Run Initial Update:**
   ```bash
   # In Railway Shell:
   cd backend
   node scripts/update-module1-section1-embedded.js
   ```

### Option C: One-Time Initialization Script

Create a script that runs automatically on deployment:

1. **Modify `server.js`** to check for empty content and auto-populate
2. **OR** use Railway's `deploy` hook to run the script
3. **OR** set up a post-deploy script in `package.json`

---

## 🎯 **Most Likely Scenario**

Based on your description ("shows up locally but not in production"), here's what probably happened:

1. ✅ You ran the update script **locally** → Local database updated
2. ❌ You **didn't run** the update script **on Railway** → Production database still empty
3. 🌐 Website reads from **production database** → Shows "No Content Available"

**Fix:**
```bash
# Just run this in Railway Shell:
cd backend
node scripts/update-module1-section1-embedded.js
```

Then verify:
```bash
node scripts/check-module1-section1.js
```

---

## 📝 **Summary**

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Script not run on Railway** | Content locally ✅, Production ❌ | Run script in Railway Shell |
| **Ephemeral storage** | Content disappears after deployment | Configure persistent volumes |
| **Frontend cache** | API has content, UI shows old | Clear browser cache |
| **Wrong section ID** | Content in DB but wrong section | Check section ID matches |
| **API errors** | Database has content, API fails | Check Railway logs for errors |

---

## 🔗 **Related Files**

- `backend/scripts/check-module1-section1.js` - Diagnostic script
- `backend/scripts/update-module1-section1-embedded.js` - Update script
- `backend/database/init.js` - Database initialization
- `backend/server.js` - Server startup (check auto-update option)
- `.railwayignore` - Files excluded from Railway builds

