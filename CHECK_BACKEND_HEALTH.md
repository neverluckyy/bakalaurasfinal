# 🏥 How to Check Backend Health

## Quick Test (Easiest)

**Open this URL in your browser:**
```
https://bakalaurasfinal-bak.up.railway.app/api/health
```

**Expected Response:**
```json
{"status":"OK","timestamp":"2024-11-27T15:30:00.000Z"}
```

✅ **If you see this** → Backend is running and healthy  
❌ **If you get an error** → See troubleshooting below

---

## Method 1: Browser Test

1. Open a new browser tab
2. Visit: `https://bakalaurasfinal-bak.up.railway.app/api/health`
3. You should see JSON response with `"status":"OK"`

---

## Method 2: Browser Console

1. Open browser console (F12)
2. Go to **Console** tab
3. Paste this code:
   ```javascript
   fetch('https://bakalaurasfinal-bak.up.railway.app/api/health')
     .then(res => res.json())
     .then(data => console.log('✅ Backend is healthy:', data))
     .catch(err => console.error('❌ Backend error:', err));
   ```
4. Press Enter
5. Check the output:
   - ✅ Success: Shows `{status: "OK", timestamp: "..."}`
   - ❌ Error: Shows error message

---

## Method 3: Railway Dashboard

1. Go to https://railway.app
2. Click on your backend project
3. Check these tabs:

   **Logs Tab:**
   - Should show recent activity
   - Look for: `Server running on port 5000`
   - No red error messages

   **Metrics Tab:**
   - Should show CPU/Memory usage
   - If all zeros → Backend might be sleeping/crashed

   **Deployments Tab:**
   - Should show a successful (green) deployment
   - If red → Deployment failed

---

## Method 4: Command Line (curl)

If you have curl installed:

```bash
curl https://bakalaurasfinal-bak.up.railway.app/api/health
```

**Expected output:**
```json
{"status":"OK","timestamp":"2024-11-27T15:30:00.000Z"}
```

---

## What Each Response Means

### ✅ Healthy Response
```json
{"status":"OK","timestamp":"2024-11-27T15:30:00.000Z"}
```
**Meaning:** Backend is running correctly!

### ❌ Connection Error / Timeout
**Error:** `ERR_CONNECTION_REFUSED` or `Failed to fetch`
**Meaning:** 
- Backend is not running
- Backend crashed
- Backend is sleeping (free tier)

**Fix:**
- Check Railway dashboard → Logs for errors
- Restart the service in Railway
- Check if backend is deployed

### ❌ 404 Not Found
**Error:** `404 Not Found`
**Meaning:**
- Backend URL is wrong
- Backend is running but route doesn't exist

**Fix:**
- Verify the Railway URL is correct
- Check Railway dashboard for the actual domain

### ❌ 502 Bad Gateway / 503 Service Unavailable
**Error:** `502` or `503`
**Meaning:**
- Backend is starting up
- Backend is overloaded
- Backend crashed

**Fix:**
- Wait a few minutes and try again
- Check Railway logs for errors
- Restart the service

---

## Troubleshooting

### Backend Not Responding

1. **Check Railway Logs:**
   - Railway Dashboard → Your Project → **Logs** tab
   - Look for error messages
   - Common errors:
     - Database connection errors
     - Missing environment variables
     - Port configuration issues

2. **Check Environment Variables:**
   - Railway Dashboard → Your Project → **Variables** tab
   - Ensure these are set:
     - `NODE_ENV=production`
     - `PORT=5000` (or Railway's assigned port)
     - `JWT_SECRET=your-secret-key`

3. **Restart Service:**
   - Railway Dashboard → Your Project
   - Click **"..."** menu → **Restart**

4. **Check Deployment Status:**
   - Railway Dashboard → **Deployments** tab
   - Ensure latest deployment is successful (green)
   - If failed, check the error message

---

## Quick Health Check Checklist

- [ ] Backend URL is correct: `https://bakalaurasfinal-bak.up.railway.app`
- [ ] Health endpoint returns: `{"status":"OK"}`
- [ ] Railway dashboard shows service is running
- [ ] No errors in Railway logs
- [ ] Environment variables are set correctly
- [ ] Latest deployment is successful

---

## Test Other Endpoints

Once health check works, you can test other endpoints:

**Root endpoint:**
```
https://bakalaurasfinal-bak.up.railway.app/
```

**Should return:**
```json
{
  "message": "Social Engineering Learning API",
  "version": "1.0.0",
  "endpoints": {...}
}
```

---

## Still Having Issues?

If the health check fails:

1. **Share the error message** you see
2. **Check Railway logs** and share any errors
3. **Verify the Railway URL** is correct in your dashboard
4. **Check if the service is deployed** (Railway → Deployments)

