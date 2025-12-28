# Scripts Organization Summary

**Date:** December 28, 2025

## Overview

All scripts in the base folder have been organized into appropriate directories. Production functionality has been verified and remains intact.

## Changes Made

### ✅ Moved to `backend/scripts/`

1. **`prepare-deployment.js`** - Deployment preparation helper
   - Updated paths to work from new location
   - Usage: `node backend/scripts/prepare-deployment.js` (from root) or `node prepare-deployment.js` (from backend/scripts)

2. **`setup-railway-deployment.js`** - Railway deployment setup helper
   - Updated paths to work from new location
   - Usage: `node backend/scripts/setup-railway-deployment.js` (from root) or `node setup-railway-deployment.js` (from backend/scripts)

3. **`test-middleware-production.js`** - Middleware production test script
   - Verified working from new location
   - Usage: `node backend/scripts/test-middleware-production.js`

### ✅ Moved to `tests/` folder

All HTML test files have been moved to a new `tests/` directory:
- `test-add-phishing-page.html`
- `test-backend.html`
- `test-image-loading.html`
- `test-middleware-browser.html`
- `test-phishing-examples.html`
- `test-phishing-images.html`
- `test-sensebait-cors.html`
- `update-phishing-content.html`

### ✅ Removed Duplicates/Empty Files

1. **`generate-jwt-secret.js`** (root) - Removed duplicate
   - Better version exists in `backend/generate-jwt-secret.js`
   - Usage: `node backend/generate-jwt-secret.js`

2. **`build-frontend.js`** - Removed (empty file)

### ✅ Moved to `backend/scripts/` (updated)

The following startup scripts have been moved to `backend/scripts/` and updated to work from their new location:
- `start-app.bat` - Windows batch script to start the app
  - Usage: `backend\scripts\start-app.bat` (from root) or `..\..\start-app.bat` (from backend/scripts)
- `start-dev.bat` - Windows batch script for development
  - Usage: `backend\scripts\start-dev.bat` (from root) or `..\..\start-dev.bat` (from backend/scripts)
- `start-dev.ps1` - PowerShell script for development
  - Usage: `backend\scripts\start-dev.ps1` (from root) or `..\..\start-dev.ps1` (from backend/scripts)

All scripts automatically detect their location and change to the project root before running npm commands.

## Path Updates

All moved scripts have been updated to correctly reference project paths:
- Scripts now use `path.join(__dirname, '..', '..')` to reach the project root
- All file operations have been verified to work from new locations

## Production Verification

✅ **All production functionality verified:**
- No references to moved scripts in production code
- No references in `package.json`, `server.js`, `railway.json`, `nixpacks.toml`, or `netlify.toml`
- Test script verified working from new location
- All middleware tests passing

## File Structure

```
project-root/
├── backend/
│   ├── scripts/
│   │   ├── prepare-deployment.js          ← Moved here
│   │   ├── setup-railway-deployment.js    ← Moved here
│   │   ├── test-middleware-production.js  ← Moved here
│   │   └── [other backend scripts...]
│   └── generate-jwt-secret.js             ← Better version kept here
├── tests/                                 ← New folder
│   ├── test-*.html                        ← All test HTML files
│   └── update-phishing-content.html
└── [no scripts in root - all organized in backend/scripts/]
```

## Usage Examples

### Running Deployment Scripts

From project root:
```bash
node backend/scripts/prepare-deployment.js
node backend/scripts/setup-railway-deployment.js
```

From backend/scripts directory:
```bash
cd backend/scripts
node prepare-deployment.js
node setup-railway-deployment.js
```

### Running Startup Scripts

From project root:
```bash
backend\scripts\start-app.bat
backend\scripts\start-dev.bat
backend\scripts\start-dev.ps1
```

Or from backend/scripts directory:
```bash
cd backend/scripts
..\..\start-app.bat
..\..\start-dev.bat
..\..\start-dev.ps1
```

### Running Test Scripts

From project root:
```bash
node backend/scripts/test-middleware-production.js
```

### Opening Test HTML Files

Open any file from the `tests/` folder in a browser:
```bash
# Example
open tests/test-middleware-browser.html
```

## Notes

- All scripts maintain backward compatibility with their original functionality
- Path references have been updated to work from new locations
- No production code was modified
- All tests pass successfully

