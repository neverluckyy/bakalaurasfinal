# 🎯 Update Content via Environment Variable (Easiest Method!)

This method requires **NO shell access** and **NO command line** - just a few clicks in Railway!

---

## ✅ Step-by-Step Instructions

### Step 1: Open Railway Dashboard

1. Go to: **https://railway.app**
2. **Log in** to your Railway account
3. Click on **your project** (the project with your backend service)

### Step 2: Open Your Backend Service

1. Click on your **backend service**
   - It might be named "backend", "Node", or your app name
   - Usually shows a Node.js icon or says "Web Service"

### Step 3: Go to Variables Tab

1. Look for tabs at the top: **Overview**, **Deployments**, **Logs**, **Variables**, **Settings**
2. Click on **"Variables"** tab
   - If you don't see it, try **"Settings"** → scroll down to **"Variables"** section
   - Or look for **"Environment Variables"**

### Step 4: Add New Variable

1. Click **"New Variable"** or **"Add Variable"** button
   - Usually in the top right or bottom of the variables list

2. Fill in the form:
   - **Variable Name**: `AUTO_UPDATE_LEARNING_CONTENT`
   - **Variable Value**: `true`
   - Make sure there are **no spaces** or quotes around `true`

3. Click **"Add"** or **"Save"**

### Step 5: Wait for Redeployment

Railway will **automatically redeploy** when you add a variable:
- You'll see a deployment starting in the **Deployments** tab
- Wait 1-2 minutes for it to complete
- You can watch the progress in **Logs** tab

### Step 6: Check Logs for Success

1. Go to **"Logs"** tab (or **Deployments** → Latest → **View Logs**)
2. Look for these messages:
   ```
   Auto-update enabled: Checking learning content...
   Starting update for Module 1 Section 1...
   ✓ Updated Introduction page
   ✓ Updated Key Concepts page
   ✅ Learning content auto-updated on startup
   ```

If you see **"✅ Learning content auto-updated on startup"**, the update was successful!

### Step 7: Verify on Your Website

1. **Clear your browser cache:**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in **Incognito/Private mode**

2. **Visit your production website** (e.g., https://sensebait.pro)

3. **Navigate to:**
   - Click **"Learn"** or **"Modules"**
   - Click **"Security Awareness Essentials"**
   - Click **"Phishing and Social Engineering"**
   - Click **"Start Learning"** or **"Continue Learning"**

4. **Verify new content appears:**
   - ✅ Introduction should show: "Welcome to the **Phishing and Social Engineering** section!"
   - ✅ Key Concepts should have detailed paragraphs about each attack type

---

## 🎉 Done!

That's it! The content is now updated. 

**Optional:** After verifying the content is updated, you can remove the variable if you want:
- Go back to **Variables** tab
- Find `AUTO_UPDATE_LEARNING_CONTENT`
- Click **delete/remove**
- Railway will redeploy (but content will stay updated)

---

## ⚠️ Troubleshooting

### Variable Not Saving
- Make sure variable name is exactly: `AUTO_UPDATE_LEARNING_CONTENT`
- Make sure value is exactly: `true` (lowercase, no quotes)
- Try refreshing the page and adding again

### Redeployment Not Starting
- Check that you clicked "Add" or "Save"
- Try removing and re-adding the variable
- Check Railway status: https://status.railway.app

### Logs Don't Show Update Message
- Wait a few more minutes
- Check if deployment completed successfully
- Look for any error messages in logs
- The update runs asynchronously, so it might take 30-60 seconds after server starts

### Content Still Not Appearing
1. **Clear browser cache completely:**
   - Open DevTools (F12)
   - Application tab → Clear storage → Clear site data

2. **Check API response:**
   - DevTools → Network tab
   - Navigate to learning page
   - Find `/api/learning-content/section/1`
   - Check if response has new content

3. **Verify variable is set:**
   - Go back to Variables tab
   - Make sure `AUTO_UPDATE_LEARNING_CONTENT` shows value `true`

---

## 📸 Visual Guide

### What You'll See:

```
Railway Dashboard
└── [Your Project]
    └── [Backend Service]
        ├── Overview
        ├── Deployments
        ├── Logs
        ├── Variables ← Click here!
        └── Settings
```

### Variables Tab:

```
Variables
└── [New Variable Button]
    └── Form:
        Name: AUTO_UPDATE_LEARNING_CONTENT
        Value: true
        [Add Button]
```

---

## ✅ Success Checklist

- [ ] Variable `AUTO_UPDATE_LEARNING_CONTENT=true` added
- [ ] Railway redeployed successfully
- [ ] Logs show "✅ Learning content auto-updated on startup"
- [ ] Browser cache cleared
- [ ] Website shows new content

---

## 🔄 How It Works

When you set `AUTO_UPDATE_LEARNING_CONTENT=true`:
1. Railway redeploys your service
2. Server starts up
3. `server.js` checks for this variable (line 153)
4. If `true`, it runs the auto-update script
5. Content gets updated in the database
6. Your website now shows the new content!

---

## 🎯 That's It!

This is the easiest method - no shell, no commands, just a few clicks! 

If you have any issues, check the troubleshooting section above or share what you see in the Railway logs.

