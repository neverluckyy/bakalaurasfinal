// Helper script to prepare deployment
// Run from project root: node backend/scripts/prepare-deployment.js
// Or from backend/scripts: node prepare-deployment.js
// This will:
// 1. Generate JWT secret
// 2. Create frontend .env file with backend URL
// 3. Provide instructions

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n=== Deployment Preparation Script ===\n');
  
  // Generate JWT Secret
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  console.log('✅ Generated JWT Secret:');
  console.log(jwtSecret);
  console.log('\n📝 Save this for your backend environment variables!\n');
  
  // Get backend URL
  const backendUrl = await question('Enter your backend URL (e.g., https://your-app.railway.app): ');
  
  if (!backendUrl || !backendUrl.startsWith('http')) {
    console.error('❌ Invalid backend URL. Must start with http:// or https://');
    process.exit(1);
  }
  
  // Create frontend .env file
  const rootDir = path.join(__dirname, '..', '..');
  const frontendEnvPath = path.join(rootDir, 'frontend', '.env');
  const envContent = `REACT_APP_API_URL=${backendUrl}\n`;
  
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log(`\n✅ Created frontend/.env file with backend URL: ${backendUrl}`);
  
  // Display next steps
  console.log('\n=== Next Steps ===\n');
  console.log('1. Add JWT_SECRET to your backend hosting platform:');
  console.log(`   JWT_SECRET=${jwtSecret}\n`);
  console.log('2. Build the frontend:');
  console.log('   cd frontend');
  console.log('   npm install');
  console.log('   npm run build\n');
  console.log('3. Upload frontend/build folder contents to Hostinger public_html\n');
  console.log('4. Upload .htaccess file to Hostinger public_html\n');
  
  rl.close();
}

main().catch(console.error);

