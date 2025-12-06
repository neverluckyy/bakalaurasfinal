#!/usr/bin/env node

/**
 * Railway Deployment Setup Helper
 * 
 * This script helps you prepare your project for Railway deployment
 * Run: node setup-railway-deployment.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n🚂 Railway Deployment Setup Helper\n');
console.log('='.repeat(50));

// Step 1: Generate JWT Secret
console.log('\n📝 Step 1: Generating JWT Secret...');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('✅ JWT Secret generated!');
console.log('\n🔑 Your JWT_SECRET (save this for Railway):');
console.log(jwtSecret);
console.log('\n');

// Step 2: Check if code is on GitHub
console.log('📋 Step 2: Checking Git status...');
try {
  const gitRemote = require('child_process')
    .execSync('git remote get-url origin', { encoding: 'utf8', stdio: 'pipe' })
    .trim();
  console.log('✅ Git remote found:', gitRemote);
  console.log('   Make sure your code is pushed to GitHub!');
} catch (error) {
  console.log('⚠️  No Git remote found.');
  console.log('   Please push your code to GitHub first:');
  console.log('   1. Create a repository on GitHub');
  console.log('   2. Run: git remote add origin <your-repo-url>');
  console.log('   3. Run: git push -u origin main');
}

// Step 3: Check Railway configuration
console.log('\n📋 Step 3: Checking Railway configuration...');
const nixpacksExists = fs.existsSync(path.join(__dirname, 'backend/nixpacks.toml'));
const dockerfileExists = fs.existsSync(path.join(__dirname, 'backend/Dockerfile'));

if (nixpacksExists) {
  console.log('✅ Found backend/nixpacks.toml');
}
if (dockerfileExists) {
  console.log('✅ Found backend/Dockerfile');
}
if (!nixpacksExists && !dockerfileExists) {
  console.log('⚠️  No build configuration found. Railway will auto-detect.');
}

// Step 4: Create frontend .env template
console.log('\n📋 Step 4: Frontend environment setup...');
const frontendEnvPath = path.join(__dirname, 'frontend/.env');
const frontendEnvExample = path.join(__dirname, 'frontend/.env.example');

if (!fs.existsSync(frontendEnvPath)) {
  const envContent = `# Railway Backend URL
# Replace YOUR_RAILWAY_URL with your actual Railway domain
# Example: https://your-app-name.railway.app
# IMPORTANT: No trailing slash!

VITE_API_URL=https://YOUR_RAILWAY_URL.railway.app
`;

  fs.writeFileSync(frontendEnvExample, envContent);
  console.log('✅ Created frontend/.env.example');
  console.log('   After deploying to Railway, update frontend/.env with your Railway URL');
} else {
  console.log('✅ frontend/.env already exists');
}

// Step 5: Display deployment checklist
console.log('\n📋 Step 5: Deployment Checklist\n');
console.log('='.repeat(50));
console.log('\n✅ PREPARATION:');
console.log('   [ ] Code pushed to GitHub');
console.log('   [ ] Railway account created (https://railway.app)');
console.log('\n🚂 RAILWAY SETUP:');
console.log('   [ ] Create new project from GitHub repo');
console.log('   [ ] Set Root Directory to: backend');
console.log('   [ ] Add environment variables:');
console.log('       - PORT=5000');
console.log('       - NODE_ENV=production');
console.log(`       - JWT_SECRET=${jwtSecret}`);
console.log('   [ ] Wait for deployment to complete');
console.log('   [ ] Get your Railway backend URL');
console.log('   [ ] Test: https://your-app.railway.app/api/health');
console.log('\n💾 DATABASE:');
console.log('   [ ] Open Railway Shell');
console.log('   [ ] Run: node database/init.js');
console.log('   [ ] Run: node scripts/import-questions.js');
console.log('\n🎨 FRONTEND:');
console.log('   [ ] Update frontend/.env with Railway URL');
console.log('   [ ] Run: cd frontend && npm run build');
console.log('   [ ] Deploy frontend/dist to your hosting');
console.log('\n🧪 TESTING:');
console.log('   [ ] Test backend health endpoint');
console.log('   [ ] Test registration');
console.log('   [ ] Test login');
console.log('   [ ] Test all features');

console.log('\n' + '='.repeat(50));
console.log('\n📚 For detailed instructions, see: DEPLOY_TO_RAILWAY.md\n');

// Save JWT secret to a temporary file (will be gitignored)
const jwtSecretPath = path.join(__dirname, '.railway-jwt-secret.txt');
fs.writeFileSync(jwtSecretPath, jwtSecret);
console.log('💾 JWT Secret saved to .railway-jwt-secret.txt (gitignored)');
console.log('   ⚠️  Keep this secret secure! Only use in Railway environment variables.\n');

