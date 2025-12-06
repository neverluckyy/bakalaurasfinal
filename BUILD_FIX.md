# Build Fix for "react-scripts: Permission denied" Error

## Problem
The build was failing with:
```
sh: 1: react-scripts: Permission denied
```

Even though the project has been migrated to Vite and `react-scripts` is no longer in the dependencies.

## Root Cause
This error typically occurs in containerized environments (like Railway) when:
1. Cached `node_modules` contain old binaries without execute permissions
2. The build process is using a cached version of the code
3. Binary permissions are not set correctly after `npm install`

## Solution Applied

### 1. Updated Root Build Script (`package.json`)
```json
"build": "cd frontend && rm -rf node_modules .cache dist && npm ci --prefer-offline --no-audit && chmod +x node_modules/.bin/* 2>/dev/null || true && npm run build"
```

This script:
- Cleans old `node_modules`, `.cache`, and `dist` directories
- Uses `npm ci` for clean, reproducible installs
- Fixes execute permissions on all binaries in `node_modules/.bin/`
- Handles errors gracefully (works on both Linux and Windows)

### 2. Updated `build-frontend.js`
- Changed `REACT_APP_API_URL` → `VITE_API_URL` (correct env var for Vite)
- Updated output directory reference from `build/` → `dist/`

### 3. Added `.npmrc` in frontend
- Optimizes npm install for CI/CD environments

## If Error Persists

If you still see the `react-scripts` error after these changes:

1. **Clear Railway Cache**: 
   - In Railway, go to your project settings
   - Clear build cache or trigger a fresh deployment

2. **Verify Code is Pushed**:
   - Ensure all changes are committed and pushed to your repository
   - Railway might be building from an old commit

3. **Check Build Logs**:
   - Verify that the build script is using the updated `package.json`
   - Look for any warnings about missing dependencies

4. **Manual Fix in Railway Shell**:
   ```bash
   cd frontend
   rm -rf node_modules
   npm ci
   chmod +x node_modules/.bin/*
   npm run build
   ```

## Verification

After deployment, verify the build works by checking:
- Build completes without errors
- Output is in `frontend/dist/` (not `frontend/build/`)
- No references to `react-scripts` in build logs

