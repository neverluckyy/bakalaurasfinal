# SQLite3 Deployment Fix

## Problem

The deployment logs show this error:
```
Error: /app/node_modules/sqlite3/build/Release/node_sqlite3.node: invalid ELF header
```

This error occurs because the `sqlite3` native module was compiled for a different platform/architecture than the deployment environment. The "invalid ELF header" indicates a binary incompatibility.

## Root Cause

1. **Native Module Issue**: `sqlite3` is a native Node.js module that needs to be compiled for the specific platform
2. **Build Tools Missing**: The deployment environment might not have the necessary build tools (gcc, make, python) available
3. **Postinstall Not Running**: The `postinstall` script might not be executing properly during deployment

## Solution Applied

### 1. Created `backend/nixpacks.toml`

This file ensures Railway (or other Nixpacks-based platforms) has the necessary build tools:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "python3", "make", "gcc"]

[phases.install]
cmds = ["npm ci", "npm rebuild sqlite3 --build-from-source"]

[phases.build]
cmds = []

[start]
cmd = "node server.js"
```

This configuration:
- Installs Node.js, Python, make, and gcc (required for building native modules)
- Runs `npm ci` for clean install
- Explicitly rebuilds sqlite3 from source for the target platform
- Sets the start command

### 2. Updated `backend/package.json`

Improved the `postinstall` script to be more robust:

```json
"postinstall": "npm rebuild sqlite3 --build-from-source --verbose || echo 'Warning: sqlite3 rebuild failed, but continuing...'"
```

This:
- Forces rebuild from source (`--build-from-source`)
- Adds verbose output for debugging
- Prevents build failure from stopping the entire deployment

## Alternative Solutions

If the above doesn't work, consider these alternatives:

### Option 1: Use better-sqlite3 (Recommended for Production)

`better-sqlite3` has better cross-platform support and is more reliable:

```bash
npm uninstall sqlite3
npm install better-sqlite3
```

Then update `backend/database/init.js` to use `better-sqlite3` instead.

### Option 2: Use Dockerfile

Create a `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild sqlite3
RUN npm ci && npm rebuild sqlite3 --build-from-source

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
```

### Option 3: Use Pure JavaScript SQLite

Switch to `sql.js` (pure JavaScript, no native dependencies):

```bash
npm uninstall sqlite3
npm install sql.js
```

## Verification Steps

After deploying with the fix:

1. **Check deployment logs** for:
   - `npm rebuild sqlite3` running successfully
   - No "invalid ELF header" errors
   - Server starting successfully

2. **Test the backend**:
   - Visit health endpoint: `https://your-app.railway.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

3. **Check database initialization**:
   - Look for "Database connection established" in logs
   - Verify no SQLite-related errors

## Next Steps

1. **Commit the changes**:
   ```bash
   git add backend/nixpacks.toml backend/package.json
   git commit -m "Fix sqlite3 deployment issue with nixpacks config"
   git push
   ```

2. **Redeploy on Railway**:
   - Railway will automatically detect the changes
   - Monitor the deployment logs
   - Verify the fix worked

3. **If still failing**:
   - Consider switching to `better-sqlite3` (Option 1 above)
   - Or use Dockerfile approach (Option 2)

## Additional Notes

- The `nixpacks.toml` file should be in the `backend` directory (where Railway's root directory is set)
- Make sure Railway's "Root Directory" is set to `backend` in project settings
- The build process may take longer now (2-3 minutes) due to compiling sqlite3 from source

