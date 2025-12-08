# Quick Guide: Update Learning Content on Railway

## 🚀 Step-by-Step Instructions

### Step 1: Access Railway Shell

1. **Go to Railway Dashboard:**
   - Visit https://railway.app
   - Log in to your account
   
2. **Open Your Project:**
   - Click on your project from the dashboard

3. **Open Railway Shell:**
   - Click on your backend service (usually shows "Node" or "Backend")
   - Look for a **"Shell"** button or tab
   - OR: Go to **Deployments** → Click on latest deployment → Click **"Shell"** button
   - This opens a terminal in your Railway environment

### Step 2: Run Diagnostic Script (Optional but Recommended)

First, check what's currently in the database:

```bash
cd backend
node scripts/check-module1-section1.js
```

This will show:
- ✅ If content exists
- ✅ If content is updated
- ✅ What needs to be fixed

### Step 3: Run the Update Script

Update the learning content:

```bash
cd backend
node scripts/update-module1-section1-embedded.js
```

**Expected Output:**
```
Starting update for Module 1 Section 1...
Database initialized successfully
Found section ID: 1
Processing 8 rows of data
Found X existing content items
Deleted existing Introduction and Key Concepts
✓ Updated Introduction page
✓ Updated Key Concepts page

Update completed successfully!
Real World Examples and other content preserved.
```

### Step 4: Verify the Update

Confirm the update worked:

```bash
cd backend
node scripts/check-module1-section1.js
```

**Expected Output:**
```
✓ Found section: Security Awareness Essentials > Phishing and Social Engineering
  Section ID: 1

Learning content items:
1. Introduction
2. Key Concepts
3. Real-World Examples (preserved)
...

Introduction: ✓ EXISTS
  - Updated: ✓ YES (new content)
Key Concepts: ✓ EXISTS
  - Updated: ✓ YES (new content)
```

### Step 5: Test on Website

1. **Clear your browser cache:**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in Incognito/Private mode

2. **Visit your website:**
   - Go to your production URL (e.g., https://sensebait.pro)
   - Navigate to: **Learn** → **Security Awareness Essentials** → **Phishing and Social Engineering**
   - Click **"Start Learning"** or **"Continue Learning"**

3. **Verify new content appears:**
   - You should see the updated Introduction with welcome message
   - Key Concepts should show detailed paragraphs about each attack type

---

## 🛠️ Troubleshooting

### Issue: "Command not found: node"

**Solution:** Make sure you're in the correct directory:
```bash
cd backend
pwd  # Should show: /app/backend or similar
node --version  # Should show Node.js version
```

### Issue: "Section not found"

**Solution:** The section might have a different ID. Check available sections:
```bash
cd backend
node -e "const {initDatabase, getDatabase} = require('./database/init'); initDatabase().then(() => { const db = getDatabase(); db.all('SELECT s.id, s.display_name, m.display_name as module FROM sections s JOIN modules m ON s.module_id = m.id', [], (err, rows) => { if (err) console.error(err); else rows.forEach(r => console.log(\`ID: \${r.id} - \${r.module} > \${r.display_name}\`)); process.exit(0); }); });"
```

### Issue: "No data provided"

**Solution:** The script's embedded data might be empty. Check:
```bash
cd backend
grep -A 2 "const csvData" scripts/update-module1-section1-embedded.js | head -5
```

Should show data array. If empty, the script needs to be updated with content.

### Issue: Script runs but content doesn't appear

**Possible causes:**
1. **Database not persisting:** Railway might be using ephemeral storage
   - Check: Railway Dashboard → Settings → Volumes
   - If no volumes configured, database resets on deployment
   
2. **Browser cache:** Clear cache completely
   - Open DevTools (F12) → Application → Clear storage → Clear site data

3. **API not updated:** Check if API returns new content
   - Open DevTools → Network tab
   - Navigate to learning page
   - Check `/api/learning-content/section/1` response

### Issue: "Permission denied" or "Database locked"

**Solution:** 
- Wait a moment and try again (database might be in use)
- Check Railway logs for database errors
- Restart the Railway service if needed

---

## 🔄 Alternative: Enable Auto-Update

To automatically update content on server restart:

1. **Railway Dashboard** → Your Project → **Variables**
2. **Add new variable:**
   - Key: `AUTO_UPDATE_LEARNING_CONTENT`
   - Value: `true`
3. **Save** and Railway will redeploy

**Note:** This updates content on each server restart. For one-time updates, use the manual method above.

---

## 📝 Quick Command Reference

```bash
# Navigate to backend
cd backend

# Check current content
node scripts/check-module1-section1.js

# Update content
node scripts/update-module1-section1-embedded.js

# Verify update
node scripts/check-module1-section1.js

# Alternative: Use comprehensive diagnostic
node scripts/diagnose-learning-content.js
```

---

## ✅ Success Checklist

After running the update, verify:

- [ ] Script output shows "Update completed successfully!"
- [ ] Diagnostic script shows "Updated: ✓ YES" for Introduction and Key Concepts
- [ ] Browser cache cleared
- [ ] Website shows new content
- [ ] No errors in Railway logs

---

## 🆘 Still Not Working?

If content still doesn't appear after following all steps:

1. **Share the output** from:
   ```bash
   node scripts/check-module1-section1.js
   ```

2. **Check Railway logs** for any errors

3. **Verify persistent storage** is configured (Settings → Volumes)

4. **Test API directly** via browser DevTools → Network tab

---

## 📚 Related Files

- `backend/scripts/update-module1-section1-embedded.js` - Update script
- `backend/scripts/check-module1-section1.js` - Diagnostic script
- `backend/scripts/diagnose-learning-content.js` - Comprehensive diagnostic
- `WHY_CONTENT_SHOWS_LOCALLY_BUT_NOT_PRODUCTION.md` - Explanation of local vs production databases

