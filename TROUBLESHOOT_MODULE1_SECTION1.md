# Troubleshooting: Module 1 Section 1 Learning Content Not Appearing

## ⚠️ **IMPORTANT: Why Content Shows Locally But Not in Production**

**Most Common Issue:** Your local database and Railway's production database are **separate**. If you updated content locally, you must also run the update script on Railway.

See `WHY_CONTENT_SHOWS_LOCALLY_BUT_NOT_PRODUCTION.md` for complete explanation.

**Quick Fix:**
```bash
# In Railway Shell:
cd backend
node scripts/update-module1-section1-embedded.js
```

---

## Issues Found and Fixed

### 1. ✅ Frontend Property Mismatch (FIXED)
**Problem**: Frontend was using `section.title` but backend API returned `section.display_name`

**Fix Applied**: Updated `backend/routes/sections.js` to also return `title` as an alias for `display_name` for consistency.

### 2. ✅ Created Diagnostic Script
**New File**: `backend/scripts/check-module1-section1.js`

This script will help you quickly diagnose what's wrong:
- Checks if the section exists
- Lists all learning content items
- Verifies if Introduction and Key Concepts are updated
- Provides clear next steps

## Troubleshooting Steps

### Step 1: Run Diagnostic Script on Railway

1. **Connect to Railway Shell**:
   - Go to your Railway project dashboard
   - Click on your backend service
   - Click "Shell" or "Deploy Logs" → "Open Shell"

2. **Run the diagnostic script**:
   ```bash
   cd backend
   node scripts/check-module1-section1.js
   ```

3. **Review the output**:
   - If it shows "❌ No learning content found", proceed to Step 2
   - If it shows content exists but is outdated, proceed to Step 2
   - If it shows content is correct, check browser cache and API responses

### Step 2: Update Learning Content

If content is missing or outdated, run the update script:

```bash
cd backend
node scripts/update-module1-section1-embedded.js
```

Expected output:
```
Starting update for Module 1 Section 1...
Database initialized successfully
Found section ID: 1
Processing 8 rows of data
Deleted existing Introduction and Key Concepts
✓ Updated Introduction page
✓ Updated Key Concepts page

Update completed successfully!
Real World Examples and other content preserved.
```

### Step 3: Verify Content is Available

After running the update script, verify it worked:

```bash
cd backend
node scripts/check-module1-section1.js
```

You should see:
- ✓ Introduction: EXISTS
- ✓ Key Concepts: EXISTS
- Both marked as "Updated: ✓ YES (new content)"

### Step 4: Test the API Endpoint

Test if the API is returning the content correctly:

1. Get your Railway backend URL (e.g., `https://your-app.up.railway.app`)
2. Get an auth token (login to your app and check browser DevTools → Application → Cookies)
3. Make a request:
   ```bash
   curl -H "Cookie: token=YOUR_TOKEN_HERE" \
        https://your-app.up.railway.app/api/learning-content/section/1
   ```
   
   Or test via browser DevTools (Network tab) when visiting the section page.

The API should return an array of learning content items including "Introduction" and "Key Concepts".

### Step 5: Clear Browser Cache

If content exists in the database but still doesn't appear:

1. **Hard refresh** your browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear cache**:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Check browser console** for any errors:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any red error messages

## Common Issues and Solutions

### Issue: "Section not found"
**Solution**: The section might have a different ID or name. Run the diagnostic script to see all available sections.

### Issue: "Database error" when running scripts
**Solution**: 
- Make sure you're in the `backend` directory
- Verify the database file exists: `ls -la database/learning_app.db`
- Check Railway logs for database connection errors

### Issue: Content exists but website shows "No Content Available"
**Possible causes**:
1. **API not returning data**: Check Network tab in browser DevTools
2. **Authentication issue**: Make sure you're logged in and cookies are being sent
3. **CORS issue**: Check Railway logs for CORS errors
4. **Section ID mismatch**: The frontend might be using a different section ID than what's in the database

### Issue: "Update script completed but no content appears"
**Check**:
1. Run the diagnostic script again to verify content was actually inserted
2. Check Railway logs for any errors during script execution
3. Verify the section ID matches (should be ID 1 for Module 1 Section 1)
4. Check if there's a transaction that wasn't committed (unlikely with SQLite, but possible)

## Verification Checklist

After following the steps above, verify:

- [ ] Diagnostic script shows content exists
- [ ] Introduction and Key Concepts are marked as "Updated: ✓ YES"
- [ ] API endpoint returns learning content array
- [ ] Browser DevTools Network tab shows successful API response
- [ ] Browser cache cleared
- [ ] Content appears on the website

## Still Not Working?

If content still doesn't appear after all steps:

1. **Check Railway Logs**:
   - Go to Railway dashboard → Your backend service → Logs
   - Look for any errors related to:
     - Database connections
     - API requests to `/api/learning-content/section/:sectionId`
     - Authentication errors

2. **Check Browser Console**:
   - Open DevTools → Console
   - Look for JavaScript errors
   - Check if API calls are failing

3. **Verify Environment**:
   - Make sure Railway backend URL is correct in Netlify environment variables
   - Verify CORS settings allow requests from your Netlify domain

4. **Check Section ID**:
   - The section ID in the URL should match what's in the database
   - You can find it by running the diagnostic script

## Files Modified

1. `backend/routes/sections.js` - Added `title` alias for `display_name`
2. `backend/scripts/check-module1-section1.js` - New diagnostic script

## Related Scripts

- `backend/scripts/update-module1-section1-embedded.js` - Main update script
- `backend/scripts/diagnose-learning-content.js` - Comprehensive diagnostic tool
- `backend/scripts/verify-learning-content.js` - Verification script

