# 🚂 Railway Deployment - Quick Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment
- [ ] Code pushed to GitHub repository
- [ ] JWT secret generated (`node generate-jwt-secret.js`)
- [ ] Railway account created (https://railway.app)

## Railway Setup
- [ ] New project created from GitHub repo
- [ ] Root directory set to `backend` (Settings tab)
- [ ] Environment variable `PORT=5000` added
- [ ] Environment variable `NODE_ENV=production` added
- [ ] Environment variable `JWT_SECRET=<your-secret>` added
- [ ] (Optional) `ALLOWED_ORIGINS` added if using custom domain

## Deployment
- [ ] Initial deployment completed
- [ ] Deployment logs show "Server running on port 5000"
- [ ] Backend URL obtained from Settings → Domains

## Database Setup
- [ ] Railway Shell opened
- [ ] Database initialized (`node database/init.js`)
- [ ] Questions imported (`node scripts/import-questions.js`)
- [ ] Logs show "Database initialized successfully"

## Testing
- [ ] Health endpoint works: `/api/health` returns `{"status":"OK"}`
- [ ] Test endpoint works: `/api/test` returns success
- [ ] No errors in Railway logs

## Frontend (If deploying separately)
- [ ] Frontend `.env` created with `REACT_APP_API_URL=<railway-backend-url>`
- [ ] Frontend built (`npm run build`)
- [ ] Frontend deployed to hosting service
- [ ] Frontend can connect to Railway backend

## Final Verification
- [ ] Full application tested (register, login, modules, quiz)
- [ ] No CORS errors in browser console
- [ ] All API endpoints working correctly

---

## 🆘 Quick Troubleshooting

**Deployment fails?**
→ Check Root Directory is `backend`
→ Check all environment variables are set
→ Check Railway logs

**Backend not responding?**
→ Verify `PORT=5000` is set
→ Check Railway logs
→ Test `/api/health` endpoint

**Database errors?**
→ Run `node database/init.js` in Railway Shell
→ Check logs for SQLite errors

**CORS errors?**
→ Add frontend domain to `ALLOWED_ORIGINS`
→ Redeploy backend

---

**Full guide:** See `RAILWAY_DEPLOYMENT_STEPS.md` for detailed instructions.

