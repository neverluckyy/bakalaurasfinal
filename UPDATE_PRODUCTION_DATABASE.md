# How to Update Learning Materials on Production (sensebait.pro)

## The Problem

When you update learning materials locally, those changes only affect your **local database**. The production database on Railway is completely separate and needs to be updated separately.

**Pushing code to GitHub does NOT update the database** - it only updates the application code.

---

## Solution: Run the Update Script on Railway

### Step 1: Access Railway Shell

1. Go to **https://railway.app**
2. Log in to your account
3. Click on your **backend project**
4. Go to the **Deployments** tab
5. Click on the **latest deployment**
6. Look for a **"Shell"** button or tab (or "Open Shell")
7. Click it to open a terminal in your Railway environment

### Step 2: Upload the CSV File

You need to get the CSV file onto Railway. Choose one method:

#### Option A: Upload via Railway Shell (Recommended)

1. In Railway Shell, navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a simple upload method. You can use `cat` to paste the file content, or use Railway's file upload feature if available.

3. Alternatively, you can temporarily add the CSV to your repository:
   - Add `teaching_material_social_engineering.csv` to the root of your repository
   - Push to GitHub: `git add teaching_material_social_engineering.csv && git commit -m "Add CSV for production update" && git push`
   - Railway will automatically pull it on the next deployment

#### Option B: Use Railway CLI (Advanced)

If you have Railway CLI installed:
```bash
railway run bash
# Then upload the file using your preferred method
```

### Step 3: Run the Update Script

**Option A: Use the Embedded Script (Recommended - No CSV file needed!)**

1. In Railway Shell, make sure you're in the backend directory:
   ```bash
   cd backend
   ```

2. Run the embedded update script (no CSV file required):
   ```bash
   node scripts/update-module1-section1-embedded.js
   ```

   This script has the data embedded directly in the code, so you don't need to upload any CSV files!

**Option B: Use the Original Script (Requires CSV file)**

1. In Railway Shell, make sure you're in the backend directory:
   ```bash
   cd backend
   ```

2. Verify the CSV file exists:
   ```bash
   ls -la teaching_material_social_engineering.csv
   # or
   ls -la ../teaching_material_social_engineering.csv
   ```

3. Run the update script:
   ```bash
   node scripts/update-module1-section1.js
   ```

4. You should see output like:
   ```
   Starting update for Module 1 Section 1...
   Database initialized successfully
   Read X rows from CSV
   Found section ID: X
   ✓ Updated Introduction page
   ✓ Updated Key Concepts page
   Update completed successfully!
   ```

### Step 4: Verify the Update

1. Visit **https://sensebait.pro**
2. Navigate to the learning section
3. Check that the updated content appears

---

## Alternative: Direct Database Update (If Script Fails)

If you can't run the script, you can update the database directly using SQL. However, this is more complex and requires knowing the exact content.

---

## Quick Checklist

- [ ] Accessed Railway Shell
- [ ] CSV file is accessible on Railway (either uploaded or in repository)
- [ ] Ran `node scripts/update-module1-section1.js` successfully
- [ ] Verified changes appear on sensebait.pro

---

## Troubleshooting

### "CSV file not found"
- Make sure the CSV file is in the repository root or backend directory
- Check the file path in the script matches where you placed it
- Try: `ls -la` to see what files are available

### "Section not found"
- The database might not be initialized properly
- Run: `node database/init.js` first
- Then run: `node scripts/add-default-modules.js`

### "Permission denied"
- Railway should have write access to the database
- Check that the database file exists and is writable

### Script runs but changes don't appear
- Clear your browser cache
- Check that Railway deployment is using the updated database
- Verify the database file is persistent (not being reset on each deployment)

---

## Important Notes

1. **Database Persistence**: Make sure Railway is using a persistent volume for the database file, otherwise it will be reset on each deployment.

2. **Backup First**: Consider backing up the production database before making changes:
   ```bash
   cp database/learning_app.db database/learning_app.db.backup
   ```

3. **Future Updates**: For future updates, you can:
   - Add the CSV to the repository (if it's not sensitive)
   - Or create a script that doesn't require a CSV file
   - Or use Railway's persistent storage to keep the CSV file

---

## Need Help?

If you encounter issues:
1. Check Railway logs for error messages
2. Verify all environment variables are set correctly
3. Ensure the database is initialized
4. Check that the CSV file format matches what the script expects

