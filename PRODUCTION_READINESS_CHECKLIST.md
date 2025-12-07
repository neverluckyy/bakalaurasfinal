# Production Readiness Checklist

This document ensures all recent changes work correctly on Railway (backend) and Netlify (frontend).

## ✅ Verified Components

### Backend (Railway)
- ✅ **Database initialization** - Works in production
- ✅ **CORS configuration** - Supports sensebait.pro and Netlify domains
- ✅ **Environment variables** - PORT, NODE_ENV, JWT_SECRET configured
- ✅ **Static file serving** - Avatars and phishing examples served correctly
- ✅ **Embedded update script** - No CSV file dependencies
- ✅ **Error handling** - Production-safe error messages
- ✅ **Rate limiting** - Configured for production

### Frontend (Netlify)
- ✅ **API URL configuration** - Uses REACT_APP_API_URL environment variable
- ✅ **Build configuration** - netlify.toml configured correctly
- ✅ **React Router** - Redirects configured for SPA
- ✅ **Axios configuration** - Handles development and production modes
- ✅ **Environment detection** - Correctly switches between localhost and production API

## 🔧 Required Environment Variables

### Railway (Backend)
Set these in Railway Dashboard → Variables:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=<your-secret-key>
ALLOWED_ORIGINS=https://sensebait.pro,https://www.sensebait.pro
FRONTEND_URL=https://sensebait.pro
```

**Optional but recommended:**
```
EMAIL_HOST=<your-email-host>
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASS=<your-password>
CONTACT_EMAIL=<contact-email>
```

### Netlify (Frontend)
Set these in Netlify Dashboard → Site settings → Environment variables:

```
REACT_APP_API_URL=https://your-railway-backend.railway.app
```

## 📋 Deployment Steps

### 1. Backend Deployment (Railway)

1. **Push code to GitHub** (if not already done)
2. **Railway auto-deploys** from GitHub
3. **Verify environment variables** are set
4. **Initialize database** (first time only):
   - Go to Railway → Deployments → Latest → Shell
   - Run: `cd backend && node database/init.js && node scripts/import-questions.js`
5. **Update learning materials** (if needed):
   - Run: `cd backend && node scripts/update-module1-section1-embedded.js`

### 2. Frontend Deployment (Netlify)

1. **Netlify auto-deploys** from GitHub
2. **Verify environment variable** `REACT_APP_API_URL` is set
3. **Check build logs** for any errors
4. **Test the site** after deployment

## 🐛 Common Issues & Fixes

### Issue: CORS Errors
**Solution:** 
- Verify `ALLOWED_ORIGINS` in Railway includes your frontend domain
- Check that `NODE_ENV=production` is set in Railway

### Issue: API Not Found (404)
**Solution:**
- Verify `REACT_APP_API_URL` is set correctly in Netlify
- Check Railway backend URL is correct
- Ensure backend is running (check Railway logs)

### Issue: Database Not Initialized
**Solution:**
- Run database initialization script in Railway Shell
- Check Railway logs for database errors
- Verify database file has write permissions

### Issue: Email Not Working
**Solution:**
- Set email environment variables in Railway
- Verify `FRONTEND_URL` is set correctly
- Check email service logs

### Issue: Static Files Not Loading
**Solution:**
- Verify static file paths in `server.js` are correct
- Check that frontend/public files are in the repository
- Ensure Railway has access to the files

## 📝 Recent Changes Verified

### Learning Materials Update
- ✅ Embedded script created (`update-module1-section1-embedded.js`)
- ✅ No CSV file dependencies
- ✅ Works in production environment
- ✅ Helper script available (`generate-embedded-data.js`)

### UI Updates
- ✅ Welcome message logic (first-time vs returning users)
- ✅ Module card styling (removed icons, full-width buttons)
- ✅ Restart quiz button logic
- ✅ Activity section filtering

### Code Quality
- ✅ No hardcoded localhost URLs in production code
- ✅ Environment variables used correctly
- ✅ Error handling production-safe
- ✅ Database paths use relative paths

## 🧪 Testing Checklist

Before considering deployment complete:

- [ ] Backend health check works: `https://your-backend.railway.app/api/health`
- [ ] Frontend loads correctly: `https://sensebait.pro`
- [ ] User registration works
- [ ] User login works
- [ ] Learning materials display correctly
- [ ] Quiz functionality works
- [ ] Leaderboard loads
- [ ] Profile page works
- [ ] Email verification links work (if email configured)
- [ ] Static assets (avatars, images) load correctly
- [ ] No console errors in browser
- [ ] No CORS errors in browser console

## 🔄 Update Process

### To Update Learning Materials:
1. Update `backend/scripts/update-module1-section1-embedded.js` with new data
2. Commit and push to GitHub
3. Railway auto-deploys
4. Run update script in Railway Shell: `node scripts/update-module1-section1-embedded.js`

### To Update Code:
1. Make changes locally
2. Test locally
3. Commit and push to GitHub
4. Railway/Netlify auto-deploy
5. Verify deployment in logs
6. Test production site

## 📚 Additional Resources

- Railway Deployment Guide: `RAILWAY_DEPLOYMENT_STEPS.md`
- Database Update Guide: `UPDATE_PRODUCTION_DATABASE.md`
- Netlify Configuration: `netlify.toml`
- Railway Configuration: `backend/nixpacks.toml`

