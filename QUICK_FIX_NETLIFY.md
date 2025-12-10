# ⚡ Quick Fix: Login 404 Error (Netlify + Railway)

## The Problem
Login fails with 404 because API requests go to Netlify instead of Railway backend.

## The Fix (2 Steps)

### Step 1: Add Environment Variable in Netlify

1. Go to **Netlify Dashboard** → Your Site → **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://bakalaurasfinal-bak.up.railway.app`
4. Click **"Save"**

### Step 2: Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 2-3 minutes

## Verify It Works

1. **Test backend:** `https://bakalaurasfinal-bak.up.railway.app/api/health`
   - Should return: `{"status":"OK"}`

2. **Test login:**
   - Visit your site → Login page
   - Open browser console (F12) → Network tab
   - Try to log in
   - Check the request URL - should be Railway backend, not Netlify

## That's It! ✅

After redeploy, login should work. The frontend will now send all API requests directly to your Railway backend.

---

**Full details:** See `NETLIFY_RAILWAY_FIX.md` for troubleshooting.

