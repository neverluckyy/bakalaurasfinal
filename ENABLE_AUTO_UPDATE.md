# Enable Auto-Update on Railway

## Quick Steps

1. Go to **Railway Dashboard** → Your backend project
2. Click **Variables** tab
3. Click **+ New Variable**
4. Add:
   - **Key**: `AUTO_UPDATE_LEARNING_CONTENT`
   - **Value**: `true`
5. Click **Add**
6. Railway will automatically redeploy
7. Wait 2-3 minutes for deployment
8. Check Railway logs - you should see:
   - `[Auto-Update] Content needs updating, starting update...`
   - `[Auto-Update] ✅ Learning content updated successfully!`

After this, the content will update automatically on every deployment!

