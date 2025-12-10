# Troubleshooting: Learning Content Not Showing Up

If you've run the update script but the new learning content doesn't appear, follow these steps:

## Step 1: Verify Database Content

Run this verification script on Railway to check what's actually in the database:

**In Railway Shell:**
```bash
cd backend
node scripts/verify-learning-content.js
```

This will show you:
- How many learning content items exist
- What their titles are
- Whether Introduction and Key Concepts are updated
- A preview of the content

## Step 2: Check for Common Issues

### Issue 1: Browser Cache
**Solution:** Clear your browser cache or do a hard refresh:
- **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Or open in Incognito/Private mode

### Issue 2: API Response Cache
**Solution:** The API doesn't cache, but check browser DevTools:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Check the request to `/api/learning-content/section/1`
5. Look at the response - does it have the new content?

### Issue 3: Script Didn't Run Successfully
**Solution:** Re-run the update script and check for errors:

```bash
cd backend
node scripts/update-module1-section1-embedded.js
```

Look for:
- ✅ "✓ Updated Introduction page"
- ✅ "✓ Updated Key Concepts page"
- ✅ "Update completed successfully!"

If you see errors, note them down.

### Issue 4: Database Not Persisting (Railway Ephemeral Storage)
**Solution:** Railway might be using ephemeral storage. Check:
1. Railway Dashboard → Your Project → Settings
2. Look for "Persistent Storage" or "Volumes"
3. If not configured, the database might reset on each deployment

**Fix:** Configure persistent storage in Railway or use Railway's database service.

### Issue 5: Wrong Section ID
**Solution:** Verify you're looking at the correct section:
- The script updates Section ID 1 (Phishing and Social Engineering)
- Make sure you're viewing `/sections/1/learn` in the app

## Step 3: Direct Database Check

If verification script shows content exists but it's not appearing:

**In Railway Shell:**
```bash
cd backend
sqlite3 database/learning_app.db "SELECT screen_title, order_index FROM learning_content WHERE section_id = 1 ORDER BY order_index;"
```

This will show all content items for section 1.

## Step 4: Check API Response Directly

Test the API endpoint directly:

1. Get your Railway backend URL (e.g., `https://your-app.railway.app`)
2. You'll need to be authenticated, but you can check in browser DevTools:
   - Open Network tab
   - Navigate to the learning page
   - Find the request to `/api/learning-content/section/1`
   - Check the response JSON

## Step 5: Force Refresh Frontend

If the database has the correct content but frontend shows old content:

1. **Clear browser cache completely**
2. **Clear localStorage:**
   - Open browser DevTools (F12)
   - Go to Application tab → Local Storage
   - Clear all items
3. **Hard refresh the page**

## Step 6: Verify Script Data

Check if the embedded data in the script matches what you expect:

**In Railway Shell:**
```bash
cd backend
grep -A 5 "const csvData" scripts/update-module1-section1-embedded.js
```

This will show the embedded data. Make sure it's not empty.

## Step 7: Re-run Update Script

If verification shows old content, re-run the update:

```bash
cd backend
node scripts/update-module1-section1-embedded.js
```

Watch for any errors or warnings.

## Step 8: Check Railway Logs

Check Railway deployment logs for any database errors:

1. Railway Dashboard → Your Project → Deployments
2. Click on latest deployment
3. View Logs
4. Look for database errors or warnings

## Common Error Messages

### "Section not found"
- The section might have a different ID
- Run verification script to find the correct section ID

### "No data provided"
- The `csvData` array in the script is empty
- Re-generate the embedded data using `generate-embedded-data.js`

### "UNIQUE constraint failed"
- Content already exists but wasn't deleted properly
- The script should handle this, but if it fails, manually delete:
  ```sql
  DELETE FROM learning_content WHERE section_id = 1 AND screen_title IN ('Introduction', 'Key Concepts');
  ```
  Then re-run the update script

## Still Not Working?

If none of the above works:

1. **Check Railway database persistence:**
   - Railway might be resetting the database on each deployment
   - Configure persistent storage or use Railway's database service

2. **Check if you're looking at the right environment:**
   - Make sure you're checking `https://sensebait.pro` (production)
   - Not `localhost:3000` (local)

3. **Verify the update script actually ran:**
   - Check Railway logs for script execution
   - Verify the script output showed success messages

4. **Contact support with:**
   - Output from `verify-learning-content.js`
   - Output from the update script
   - Screenshot of what you see vs. what you expect

