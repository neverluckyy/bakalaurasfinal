# Quick Start - Vite Migration

## 🚀 Installation & Testing

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `vite` - Modern build tool
- `@vitejs/plugin-react` - React support for Vite
- Type definitions for React

### Step 2: Test Development Server

```bash
# From frontend directory
npm run dev

# OR from root directory
npm run dev:frontend
```

**Expected Result:**
- ✅ Server starts in **seconds** (not minutes!)
- ✅ App opens at http://localhost:3000
- ✅ Hot Module Replacement works instantly
- ✅ API calls proxy to http://localhost:5000

### Step 3: Test Production Build

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

**Expected Result:**
- ✅ Build completes quickly
- ✅ Output in `frontend/dist/` directory
- ✅ Preview shows production version

## 🎯 What to Expect

### Before (React Scripts)
- ❌ Dev server: 30-60 seconds startup
- ❌ Slow hot reload
- ❌ Large bundle sizes

### After (Vite)
- ✅ Dev server: 2-5 seconds startup
- ✅ Instant hot reload
- ✅ Optimized bundles

## ⚠️ Important Notes

1. **Backend must be running** - Vite proxies `/api/*` to `http://localhost:5000`
2. **Build directory changed** - Now `dist/` instead of `build/`
3. **Environment variables** - Use `VITE_` prefix instead of `REACT_APP_`

## 🐛 Troubleshooting

### Error: "Cannot find module 'vite'"
**Solution:** Run `npm install` in the `frontend/` directory

### Error: "Proxy error" or API calls fail
**Solution:** 
1. Make sure backend is running on port 5000
2. Check `vite.config.js` proxy settings

### Error: "Module not found"
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## ✅ Migration Checklist

- [x] Vite configuration created
- [x] index.html moved to root
- [x] Package.json updated
- [x] Environment variables updated
- [x] Netlify config updated
- [ ] **YOU:** Install dependencies (`npm install`)
- [ ] **YOU:** Test dev server (`npm run dev`)
- [ ] **YOU:** Test production build (`npm run build`)

---

**Ready to go!** Run `npm install` and then `npm run dev` to see the speed difference! ⚡

