// Quick script to build frontend with backend URL
// Usage: node build-frontend.js <backend-url>

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendUrl = process.argv[2];

if (!backendUrl) {
  console.error('❌ Error: Backend URL required');
  console.log('Usage: node build-frontend.js <backend-url>');
  console.log('Example: node build-frontend.js https://your-app.railway.app');
  process.exit(1);
}

let url = backendUrl;
if (!url.startsWith('http')) {
  url = 'https://' + url;
}

console.log(`\n🔨 Building frontend with backend URL: ${url}\n`);

// Create .env file
const envPath = path.join(__dirname, 'frontend', '.env');
const envContent = `REACT_APP_API_URL=${url}\n`;
fs.writeFileSync(envPath, envContent);
console.log(`✅ Created frontend/.env`);

// Build
try {
  process.chdir('frontend');
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('🔨 Building...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Frontend built successfully!');
  console.log('📁 Files are in: frontend/build/');
  console.log('📤 Ready to upload to Hostinger!\n');
  process.chdir('..');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.chdir('..');
  process.exit(1);
}

