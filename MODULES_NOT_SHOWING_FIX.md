# 🔧 Modules Not Showing - Troubleshooting Guide

## Problem
Registration works, but modules page shows "No modules available".

## Possible Causes

1. **Database doesn't have modules** (most likely)
2. **API call is failing** (check browser console)
3. **Authentication issue** (modules endpoint requires auth)
4. **Database not initialized properly**

## Step-by-Step Diagnosis

### Step 1: Check Browser Console

1. **Open the modules page:**
   - `https://beamish-granita-b7abb8.netlify.app/modules`

2. **Open browser console (F12) → Console tab**

3. **Look for errors:**
   - Red error messages
   - Network errors
   - API errors

4. **Check Network tab:**
   - Go to **Network** tab
   - Refresh the page
   - Look for `/api/modules` request
   - Check the **Status** code:
     - `200` = Success (but no modules in response)
     - `401` = Authentication error
     - `500` = Server error
     - `404` = Route not found

### Step 2: Test Backend Directly

**Test the modules endpoint:**

Open browser console (F12) and run:
```javascript
fetch('https://bakalaurasfinal-bak.up.railway.app/api/modules', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('Modules response:', data);
  console.log('Number of modules:', Array.isArray(data) ? data.length : 'Not an array');
})
.catch(err => console.error('Error:', err));
```

**What to look for:**
- ✅ Empty array `[]` = Database has no modules
- ✅ Array with modules = Modules exist, frontend issue
- ❌ Error = Backend issue

### Step 3: Check Railway Logs

1. **Go to Railway Dashboard → Your Project → Logs**
2. **Look for:**
   - `Database initialized successfully`
   - Any database errors
   - Module insertion errors

### Step 4: Verify Database Has Modules

The database initialization should create 3 default modules. If they're missing, we need to add them.

## Solutions

### Solution 1: Database Doesn't Have Modules (Most Likely)

The database initialization creates modules, but they might not have been inserted. We need to add them manually or reinitialize.

**Option A: Use Admin Panel (if you have admin access)**

1. Register/login as admin
2. Go to Admin panel
3. Create modules manually

**Option B: Add Modules via Railway Shell**

1. Go to Railway Dashboard → Your Project
2. Click **"..."** menu → **"Open Shell"**
3. Run:
   ```bash
   cd backend
   node -e "
   const { getDatabase } = require('./database/init');
   const db = getDatabase();
   db.run(\`
     INSERT OR IGNORE INTO modules (name, display_name, description, order_index) VALUES
     ('Module 1: Security Awareness Essentials', 'Security Awareness Essentials', 'Core security concepts and best practices', 1),
     ('Module 2: Phishing Red Flags', 'Phishing Red Flags', 'Identifying and avoiding phishing attempts', 2),
     ('Module 3: Business Email Compromise (BEC)', 'Business Email Compromise (BEC)', 'Understanding and preventing BEC attacks', 3)
   \`, (err) => {
     if (err) console.error('Error:', err);
     else console.log('Modules inserted successfully');
     process.exit(0);
   });
   "
   ```

**Option C: Create a Script to Add Modules**

I can create a script to add default modules.

### Solution 2: API Call Failing

If the API call is failing:

1. **Check authentication:**
   - Make sure you're logged in
   - Check if cookies are being sent
   - Verify JWT token is valid

2. **Check CORS:**
   - Verify backend CORS allows Netlify domain
   - Check browser console for CORS errors

### Solution 3: Database Not Initialized

If database wasn't initialized:

1. **Check Railway logs** for initialization errors
2. **Restart the service** to trigger re-initialization
3. **Or manually initialize** via Railway shell

## Quick Test

**Test if modules endpoint works:**

Open this in browser console (F12):
```javascript
// First, make sure you're logged in, then:
fetch('https://bakalaurasfinal-bak.up.railway.app/api/modules', {
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('Modules:', d))
.catch(e => console.error('Error:', e));
```

**Expected results:**
- Empty array `[]` = No modules in database (need to add them)
- Array with modules = Modules exist (frontend might have issue)
- Error = Backend/authentication issue

## Most Likely Issue

**Database doesn't have modules yet.** The initialization script uses `INSERT OR IGNORE`, which means if modules already exist (even if empty), they won't be inserted.

**Fix:** Add modules manually via Admin panel or Railway shell.

