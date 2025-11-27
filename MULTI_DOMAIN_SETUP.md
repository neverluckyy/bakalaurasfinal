# 🌐 Multi-Domain Setup Guide

Your project is now configured to work on **both domains**:
- ✅ `https://beamish-granita-b7abb8.netlify.app` (Netlify subdomain)
- ✅ `https://sensebait.pro` (Custom domain)

## ✅ What's Already Configured

### Backend CORS (Railway)
The backend is configured to accept requests from:
- `https://sensebait.pro`
- `https://www.sensebait.pro`
- `https://beamish-granita-b7abb8.netlify.app`
- All other `*.netlify.app` subdomains (via regex pattern)

### Frontend (Netlify)
- Netlify automatically serves your site on both domains
- React Router redirects are configured in `netlify.toml`

## 🔧 Setup Steps

### Step 1: Deploy Updated Backend

1. **Commit and push the updated backend:**
   ```bash
   git add backend/server.js
   git commit -m "Update CORS for multi-domain support"
   git push
   ```

2. **Railway will auto-deploy** - wait for deployment to complete

3. **Verify NODE_ENV is set in Railway:**
   - Go to Railway dashboard → Your project → Variables
   - Ensure `NODE_ENV=production` is set
   - If not, add it:
     - **Key**: `NODE_ENV`
     - **Value**: `production`

### Step 2: Verify Netlify Configuration

1. **Check Netlify Site Settings:**
   - Go to Netlify dashboard → Your site → Site settings → Domain management
   - Verify both domains are listed:
     - `beamish-granita-b7abb8.netlify.app` ✅
     - `sensebait.pro` (may show "Pending DNS verification")

2. **Complete DNS Setup for Custom Domain:**
   - If `sensebait.pro` shows "Pending DNS verification":
     - Click on the domain
     - Follow Netlify's DNS instructions
     - Add the required DNS records to your domain registrar

### Step 3: Verify Environment Variables

1. **In Netlify Dashboard:**
   - Go to Site settings → Environment variables
   - Ensure `REACT_APP_API_URL` is set to your Railway backend URL
   - Example: `https://your-app.railway.app`

2. **In Railway Dashboard:**
   - Go to Variables
   - Ensure `NODE_ENV=production` is set

### Step 4: Test Both Domains

1. **Test Netlify Subdomain:**
   - Visit: `https://beamish-granita-b7abb8.netlify.app`
   - Try registering a new account
   - Check browser console (F12) for errors

2. **Test Custom Domain:**
   - Visit: `https://sensebait.pro`
   - Try registering a new account
   - Check browser console (F12) for errors

3. **Verify API Calls:**
   - Open browser console (F12) → Network tab
   - Try to register/login
   - Check that API calls go to your Railway backend
   - Verify no CORS errors appear

## 🔍 Troubleshooting

### Issue: CORS errors on one domain but not the other

**Solution:**
1. Check Railway logs to see which origin is being blocked
2. Verify `NODE_ENV=production` is set in Railway
3. Check that the domain is in the allowed origins list

### Issue: Custom domain shows "Pending DNS verification"

**Solution:**
1. In Netlify → Domain settings → Click on `sensebait.pro`
2. Follow the DNS setup instructions
3. Add the required DNS records (usually A or CNAME records)
4. Wait 24-48 hours for DNS propagation

### Issue: Site works on Netlify subdomain but not custom domain

**Solution:**
1. Verify DNS records are correctly configured
2. Check SSL certificate status in Netlify
3. Ensure custom domain is properly connected in Netlify

### Issue: Registration fails on both domains

**Solution:**
1. Check Railway backend logs for errors
2. Verify backend is running and accessible
3. Test backend health endpoint: `https://your-backend.railway.app/api/health`
4. Verify `REACT_APP_API_URL` is set correctly in Netlify

## 📋 Quick Checklist

- [ ] Backend deployed to Railway with `NODE_ENV=production`
- [ ] `REACT_APP_API_URL` set in Netlify environment variables
- [ ] Netlify subdomain accessible: `https://beamish-granita-b7abb8.netlify.app`
- [ ] Custom domain DNS configured (if using `sensebait.pro`)
- [ ] Registration works on Netlify subdomain
- [ ] Registration works on custom domain (if DNS is set up)
- [ ] No CORS errors in browser console
- [ ] API calls successful on both domains

## 🎯 Current Status

Based on your setup:
- ✅ **Netlify subdomain**: Should work immediately after backend redeploy
- ⏳ **Custom domain**: Needs DNS configuration if not already done

## 💡 Pro Tip

You can test the backend CORS configuration by checking the response headers:
```bash
curl -H "Origin: https://beamish-granita-b7abb8.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend.railway.app/api/auth/register
```

If CORS is configured correctly, you should see `Access-Control-Allow-Origin` header in the response.

