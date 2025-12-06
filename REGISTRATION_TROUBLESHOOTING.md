# 🔧 Registration Failed - Troubleshooting Guide

## Common Causes

### 1. ❌ Missing `REACT_APP_API_URL` Environment Variable (MOST COMMON)

**Problem:** Frontend doesn't know where your backend is located.

**Solution:**
1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Click **"Add environment variable"**
3. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend.railway.app` (replace with your actual Railway URL)
4. Click **"Save"**
5. **Trigger a new deploy:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Wait 2-3 minutes for rebuild

**How to verify:**
- After rebuild, open browser console (F12) on the registration page
- Check Network tab when you try to register
- The API call should go to your Railway backend URL, not to Netlify

---

### 2. ❌ Backend CORS Not Configured

**Problem:** Backend is blocking requests from Netlify domain.

**Solution:**
1. **Verify backend is deployed with latest CORS changes:**
   ```bash
   git add backend/server.js
   git commit -m "Update CORS for Netlify"
   git push
   ```

2. **Check Railway environment variable:**
   - Go to Railway Dashboard → Your Project → **Variables**
   - Ensure `NODE_ENV=production` is set
   - If not, add it:
     - **Key**: `NODE_ENV`
     - **Value**: `production`

3. **Wait for Railway to redeploy** (2-3 minutes)

**How to verify:**
- Test backend health: `https://your-backend.railway.app/api/health`
- Should return: `{"status":"OK","timestamp":"..."}`

---

### 3. ❌ Backend Not Running

**Problem:** Railway backend is down or crashed.

**Solution:**
1. Go to Railway Dashboard → Your Project
2. Check **Deployments** tab for errors
3. Check **Logs** tab for error messages
4. Common issues:
   - Database initialization failed
   - Missing environment variables
   - Port configuration issues

**How to verify:**
- Visit: `https://your-backend.railway.app/api/health`
- Should return JSON response, not an error

---

### 4. ❌ Network/CORS Error in Browser

**Problem:** Browser console shows CORS errors.

**Solution:**
1. Open browser console (F12) → **Console** tab
2. Look for errors like:
   - `Access to XMLHttpRequest blocked by CORS policy`
   - `Network Error`
   - `Failed to fetch`

3. **If you see CORS errors:**
   - Verify backend CORS configuration (see #2 above)
   - Check that `NODE_ENV=production` is set in Railway
   - Verify backend allows `https://beamish-granita-b7abb8.netlify.app`

---

### 5. ❌ Missing Avatar Parameter

**Problem:** Registration API expects `avatar_key` but frontend might not be sending it.

**Temporary workaround:** The backend has a default (`robot_coral`), so this shouldn't cause complete failure, but let's verify the Register component.

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Browser Console

1. Open `https://beamish-granita-b7abb8.netlify.app/register`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to register
5. **Look for errors:**
   - Red error messages
   - CORS errors
   - Network errors

### Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Try to register
3. **Look for the API call:**
   - Should be to `/api/auth/register`
   - Check the **Request URL** - where is it going?
   - If it's going to `beamish-granita-b7abb8.netlify.app/api/auth/register` → **Problem: Missing REACT_APP_API_URL**
   - If it's going to your Railway URL → Good, check the response

4. **Check the response:**
   - Click on the `/api/auth/register` request
   - Check **Status** code:
     - `200` = Success (but frontend might be handling it wrong)
     - `400` = Bad request (validation error)
     - `409` = User already exists
     - `500` = Server error
     - `CORS error` = CORS configuration issue

### Step 3: Check Backend Logs

1. Go to Railway Dashboard → Your Project → **Logs**
2. Try to register again
3. **Look for:**
   - Error messages
   - Database errors
   - CORS errors

### Step 4: Test Backend Directly

1. Open a new tab
2. Visit: `https://your-backend.railway.app/api/health`
3. Should return: `{"status":"OK","timestamp":"..."}`
4. If you get an error → Backend is not running properly

---

## ✅ Quick Fix Checklist

Run through this checklist in order:

- [ ] **REACT_APP_API_URL is set in Netlify** (Site settings → Environment variables)
- [ ] **Netlify site has been redeployed** after setting environment variable
- [ ] **NODE_ENV=production is set in Railway** (Variables tab)
- [ ] **Backend is running** (test `/api/health` endpoint)
- [ ] **Backend CORS allows Netlify domain** (check backend/server.js)
- [ ] **No CORS errors in browser console**
- [ ] **Network tab shows API calls going to Railway backend**

---

## 🚨 Most Likely Issue

Based on the error "Registration failed", the **most common cause** is:

**Missing `REACT_APP_API_URL` in Netlify environment variables**

This means:
- Frontend doesn't know where your backend is
- API calls go to the same domain (Netlify) instead of Railway
- Netlify doesn't have a backend, so registration fails

**Fix:**
1. Set `REACT_APP_API_URL` in Netlify
2. Redeploy the site
3. Try again

---

## 📞 Still Not Working?

If you've checked everything above and it's still not working:

1. **Share the browser console errors** (F12 → Console tab)
2. **Share the Network tab details** (F12 → Network tab → Click on the failed request)
3. **Share Railway backend logs** (Railway Dashboard → Logs tab)

This will help identify the exact issue.

