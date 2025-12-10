# Fix: Update Learning Content on Production (sensebait.pro)

## The Problem

Your localhost shows the new detailed learning content, but the online version (sensebait.pro) still shows old content (short bullet points). This is because the **production database on Railway hasn't been updated yet**.

## Solution: Run Force Update Script on Railway

### Step 1: Access Railway Shell

1. Go to **https://railway.app**
2. Log in
3. Click on your **backend project**
4. Go to **Deployments** tab
5. Click on **latest deployment**
6. Click **"Shell"** button (or "Open Shell")

### Step 2: Run the Force Update Script

In Railway Shell, run these commands:

```bash
cd backend
node scripts/force-update-learning-content.js
```

**Expected Output:**
```
================================================================================
FORCE UPDATE: Learning Content for Module 1 Section 1
================================================================================

✓ Found section ID: 1

Step 1: Deleting existing Introduction and Key Concepts...
✓ Deleted user progress for X content items
✓ Deleted existing Introduction and Key Concepts

Step 2: Inserting new content...

✓ Inserted Introduction (ID: X)
✓ Inserted Key Concepts (ID: X)

Step 3: Verifying update...

  ✓ Introduction (order: 1, length: XXXX chars)
  ✓ Key Concepts (order: 2, length: XXXX chars)

================================================================================
✅ UPDATE COMPLETED SUCCESSFULLY!
================================================================================
```

### Step 3: Clear Browser Cache

After running the script:

1. **Hard refresh** your browser:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. **Or open in Incognito/Private mode**
3. **Or clear browser cache completely**

### Step 4: Verify

1. Visit **https://sensebait.pro**
2. Navigate to: **Learn** → **Security Awareness Essentials** → **Phishing and Social Engineering**
3. Click **"Start Learning"** or **"Continue Learning"**
4. You should now see:
   - **Introduction** with welcome message and references
   - **Key Concepts** with:
     - Detailed paragraph about "Understanding social engineering tactics"
     - Section "Types of Social Engineering Attacks" with:
       - Detailed paragraphs for Phishing, Vishing, Smishing, Pretexting, Baiting, Tailgating
       - Each with full explanations, activity prompts, and references

## If It Still Doesn't Work

### Check 1: Verify Database Content

Run this to see what's actually in the database:

```bash
cd backend
node scripts/verify-learning-content.js
```

This will show you exactly what content exists.

### Check 2: Test API Directly

1. Open https://sensebait.pro
2. Open DevTools (F12) → Network tab
3. Navigate to the learning section
4. Find request: `/api/learning-content/section/1`
5. Check the Response - does it show new content?

### Check 3: Railway Database Persistence

Railway might be using ephemeral storage (database resets on deployment):

1. Railway Dashboard → Your Project → Settings
2. Check for "Persistent Storage" or "Volumes"
3. If not configured, the database may reset on each deployment

**Solution:** Configure persistent storage in Railway or use Railway's database service.

## What the New Content Should Look Like

**Key Concepts** should contain:

1. **Main section:** "Understanding social engineering tactics (the 'why it works')"
   - Full paragraph explaining social engineering
   - Activity prompt
   - References

2. **Subsection:** "Types of Social Engineering Attacks"
   - **Phishing (email): "the inbox trap"** - Full detailed paragraph
   - **Vishing (voice): "the convincing caller"** - Full detailed paragraph
   - **Smishing (SMS/text): "fast taps, big consequences"** - Full detailed paragraph
   - **Pretexting: "the believable story"** - Full detailed paragraph
   - **Baiting: "free stuff that costs you"** - Full detailed paragraph
   - **Tailgating (physical): "the door-hold exploit"** - Full detailed paragraph
   - **Wrap-up checklist (Stop. Verify. Report.)** - Full detailed paragraph

Each with detailed explanations, not just bullet points.

## Quick Reference

**To update production database:**
```bash
cd backend
node scripts/force-update-learning-content.js
```

**To verify what's in database:**
```bash
cd backend
node scripts/verify-learning-content.js
```

**To check if content is correct:**
- Look for content length > 1000 characters for Key Concepts
- Should have detailed paragraphs, not just bullet points
- Should include references at the bottom

