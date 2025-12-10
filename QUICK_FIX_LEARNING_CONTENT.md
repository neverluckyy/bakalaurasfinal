# 🚨 Quick Fix: Update Learning Content on Railway

## The Problem
- ✅ Backend is working (you can see the API info)
- ❌ Database still has old learning content
- ❌ Website shows old content

## The Solution: Run Update Script on Railway

### Step-by-Step:

1. **Open Railway Shell:**
   - Go to: https://railway.app
   - Click your backend project
   - Go to **Deployments** tab
   - Click **Latest deployment**
   - Click **"Shell"** button

2. **Run the Update Script:**
   ```bash
   cd backend
   node scripts/nuclear-update-learning-content.js
   ```

3. **Wait for Success:**
   You should see:
   ```
   ✅ NUCLEAR UPDATE COMPLETED SUCCESSFULLY!
   ```

4. **Refresh Browser:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in Incognito/Private mode
   - Visit: `https://sensebait.pro/sections/1/learn`

5. **Verify:**
   You should see new Introduction starting with:
   > "Welcome to the **Phishing and Social Engineering** section!"

---

## Alternative: Enable Auto-Update (Recommended for Future)

After fixing it manually, enable auto-update so it updates automatically:

1. Railway Dashboard → Your project → **Variables** tab
2. Click **+ New Variable**
3. Add:
   - **Key**: `AUTO_UPDATE_LEARNING_CONTENT`
   - **Value**: `true`
4. Click **Add**
5. Railway will redeploy automatically

Now every time you push code, it will check and update content if needed!

