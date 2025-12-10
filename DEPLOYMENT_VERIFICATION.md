# Deployment Verification Guide

## Quick Verification Steps

### 1. Backend (Railway) Verification

**Check Health Endpoint:**
```bash
curl https://your-backend.railway.app/api/health
```
Expected: `{"status":"OK","timestamp":"..."}`

**Check Test Endpoint:**
```bash
curl https://your-backend.railway.app/api/test
```
Expected: `{"message":"Routes are working!","timestamp":"..."}`

**Verify Environment Variables:**
- Go to Railway Dashboard → Your Project → Variables
- Ensure these are set:
  - `PORT=5000`
  - `NODE_ENV=production`
  - `JWT_SECRET=<your-secret>`
  - `ALLOWED_ORIGINS=https://sensebait.pro,https://www.sensebait.pro`
  - `FRONTEND_URL=https://sensebait.pro` (optional but recommended)

**Check Logs:**
- Railway Dashboard → Deployments → Latest → View Logs
- Should see: "Server running on port 5000"
- Should see: "Database initialized successfully"

### 2. Frontend (Netlify) Verification

**Check Environment Variables:**
- Netlify Dashboard → Site settings → Environment variables
- Ensure `REACT_APP_API_URL` is set to your Railway backend URL

**Check Build:**
- Netlify Dashboard → Deployments → Latest
- Build should complete successfully
- No build errors in logs

**Test Site:**
- Visit `https://sensebait.pro`
- Open browser console (F12)
- Check for any errors
- Verify API calls are going to correct backend URL

### 3. Database Verification

**Check if Database is Initialized:**
- Railway Shell → Run: `cd backend && sqlite3 database/learning_app.db "SELECT COUNT(*) FROM modules;"`
- Should return a number > 0

**Update Learning Materials (if needed):**
- Railway Shell → Run: `cd backend && node scripts/update-module1-section1-embedded.js`
- Should see: "✓ Updated Introduction page" and "✓ Updated Key Concepts page"

## Common Issues

### CORS Errors
**Symptoms:** Browser console shows CORS errors
**Fix:** 
1. Add your frontend domain to `ALLOWED_ORIGINS` in Railway
2. Ensure `NODE_ENV=production` is set
3. Redeploy backend

### 404 on API Calls
**Symptoms:** Network tab shows 404 for API requests
**Fix:**
1. Verify `REACT_APP_API_URL` is set correctly in Netlify
2. Check Railway backend is running
3. Verify backend URL is correct

### Database Errors
**Symptoms:** Errors about database not found or locked
**Fix:**
1. Run database initialization: `node database/init.js`
2. Check Railway logs for database errors
3. Verify database file permissions

### Static Files Not Loading
**Symptoms:** Avatars or images don't load
**Fix:**
1. Verify files exist in `frontend/public/avatars` and `frontend/public/phishing-examples`
2. Check Railway logs for static file serving errors
3. Verify paths in `server.js` are correct

## All Recent Changes Verified ✅

1. ✅ **Embedded Update Script** - No CSV dependencies, works in production
2. ✅ **Welcome Message Logic** - First-time vs returning users
3. ✅ **Module Card Updates** - Removed icons, full-width buttons
4. ✅ **Restart Quiz Button** - Conditional display logic
5. ✅ **Activity Filtering** - Activity sections hidden from display
6. ✅ **CORS Configuration** - Supports all required domains
7. ✅ **Environment Variables** - Properly configured for production
8. ✅ **API Configuration** - Frontend correctly uses environment variables
9. ✅ **Error Handling** - Production-safe error messages
10. ✅ **Database Paths** - Relative paths work in production

## Next Steps After Deployment

1. **Test User Registration** - Create a new account
2. **Test User Login** - Log in with test account
3. **Test Learning Materials** - Navigate through learning content
4. **Test Quiz** - Complete a quiz section
5. **Test Leaderboard** - Verify leaderboard loads
6. **Test Profile** - Update profile settings
7. **Test Email** - Verify email verification works (if configured)

## Support

If you encounter issues:
1. Check Railway logs for backend errors
2. Check Netlify build logs for frontend errors
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
5. Review `PRODUCTION_READINESS_CHECKLIST.md` for detailed troubleshooting

