# Quick Frontend Deployment Steps

## Before Building

1. **Set your backend URL** in `frontend/.env`:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
   (Replace with your actual backend URL)

## Build Command

```bash
cd frontend
npm run build
```

## Upload to Hostinger

Upload **all contents** of `frontend/build` folder to `public_html` in Hostinger File Manager.

Also upload `.htaccess` file (from project root) to `public_html`.

