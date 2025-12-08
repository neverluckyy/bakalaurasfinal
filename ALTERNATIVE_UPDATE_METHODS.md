# Alternative Methods to Update Content (If Shell Not Available)

Since you can't find Railway Shell, here are alternative ways to update the content:

---

## Method 1: Enable Auto-Update (Easiest - No Shell Needed!)

This method uses the built-in auto-update feature that runs on server startup.

### Steps:

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Click on your project
   - Click on your backend service

2. **Go to Variables/Environment Variables**
   - Click **"Variables"** tab (or "Environment" or "Settings" → "Variables")
   - Or: Click **"Settings"** → Scroll to **"Variables"** section

3. **Add New Variable**
   - Click **"New Variable"** or **"Add Variable"** button
   - **Variable Name**: `AUTO_UPDATE_LEARNING_CONTENT`
   - **Variable Value**: `true`
   - Click **"Add"** or **"Save"**

4. **Redeploy/Restart Service**
   - Railway will automatically redeploy when you add a variable
   - OR manually trigger redeploy:
     - Go to **Deployments** tab
     - Click **"Redeploy"** or **"Deploy"**

5. **Wait for Deployment**
   - Check the deployment logs
   - You should see: `"✅ Learning content auto-updated on startup"`
   - Takes 1-2 minutes

6. **Verify**
   - Visit your website
   - Clear browser cache (`Ctrl+Shift+R`)
   - Check if new content appears

**Note**: This will update content every time the server restarts. Once content is updated, you can remove this variable if you want.

---

## Method 2: Use Railway CLI (Command Line Tool)

This works from your local computer, no need for Railway Shell.

### Install Railway CLI:

**Windows (PowerShell as Administrator):**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm https://railway.app/install.ps1 | iex
```

**Mac/Linux:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### Login:
```bash
railway login
```
This will open your browser to authorize.

### Link to Your Project:
```bash
railway link
```
- It will show your projects
- Select your project using arrow keys
- Press Enter

### Run Update Script:
```bash
railway run --service backend "cd backend && node scripts/update-railway-simple.js"
```

Or if that doesn't work:
```bash
railway run --service backend bash -c "cd backend && node scripts/update-railway-simple.js"
```

---

## Method 3: Add Update Script to Package.json

This runs the update automatically during deployment.

### Steps:

1. **Edit `backend/package.json`** on your local computer

2. **Add a script**:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "postinstall": "node scripts/update-module1-section1-embedded.js"
     }
   }
   ```

3. **Commit and push to GitHub**:
   ```bash
   git add backend/package.json
   git commit -m "Auto-update learning content on deploy"
   git push
   ```

4. **Railway will automatically redeploy**
   - The update script will run after `npm install`
   - Check deployment logs to verify

**Warning**: This runs on EVERY deployment. Consider using a flag instead.

---

## Method 4: Create an API Endpoint to Trigger Update

Create a one-time admin endpoint that you can call from your browser.

### Steps:

1. **Add to `backend/routes/admin.js`** (you'll need to push this code):

```javascript
// Add this to admin.js routes
router.post('/update-learning-content', authenticateToken, async (req, res) => {
  // Check if user is admin
  const db = getDatabase();
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT is_admin FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { updateModule1Section1 } = require('../scripts/update-module1-section1-embedded');
    await updateModule1Section1();
    res.json({ success: true, message: 'Learning content updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Push to GitHub** - Railway will auto-deploy

3. **Call the endpoint** from your browser (while logged in as admin):
   ```
   POST https://your-railway-url.railway.app/api/admin/update-learning-content
   ```

4. **Or use curl**:
   ```bash
   curl -X POST https://your-railway-url.railway.app/api/admin/update-learning-content \
     -H "Cookie: token=YOUR_AUTH_TOKEN"
   ```

---

## Method 5: Manual Database Update via Admin Panel

If you have an admin panel in your app:

1. Log in as admin
2. Check if there's an admin interface
3. Look for content management features
4. Update content through the UI

---

## Method 6: Use Railway's Database Service

If Railway offers a database service you can connect to:

1. **Railway Dashboard** → Add **PostgreSQL** or **MySQL** service
2. **Connect to it** using database client
3. **Manually insert/update** the learning_content table

**Note**: This is complex and only works if Railway offers managed databases.

---

## 🎯 Recommended Approach

**Best for you right now**: **Method 1 (Auto-Update)**

It's the easiest and doesn't require:
- ❌ Finding Railway Shell
- ❌ Installing CLI tools
- ❌ Modifying code
- ❌ Command line access

Just:
1. ✅ Add one environment variable
2. ✅ Wait for redeploy
3. ✅ Done!

---

## 📋 Method 1 Quick Steps (Recommended)

1. Railway Dashboard → Your Project → Backend Service
2. Click **"Variables"** tab
3. Click **"New Variable"**
4. Name: `AUTO_UPDATE_LEARNING_CONTENT`
5. Value: `true`
6. Click **"Add"**
7. Wait 1-2 minutes for redeploy
8. Check your website!

---

## ✅ After Using Auto-Update

Once content is updated (check logs for success message), you can:

1. **Remove the variable** (optional):
   - Go back to Variables
   - Delete `AUTO_UPDATE_LEARNING_CONTENT`
   - Content will stay updated

2. **Or keep it**:
   - It will auto-update on every restart
   - Good if you make frequent changes

---

## 🆘 Still Need Help?

If none of these work:

1. **Describe what you see** in Railway dashboard
2. **Check Railway documentation**: https://docs.railway.app
3. **Try Railway support**: Click "Help" in Railway dashboard

