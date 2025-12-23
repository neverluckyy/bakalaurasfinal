const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

/**
 * Test script to verify images are accessible
 */

const testImagePath = path.join(__dirname, '../../frontend/public/phishing-examples/bgs-security-email.png');

console.log('Testing image serving...\n');

// Check if image file exists
if (fs.existsSync(testImagePath)) {
  console.log('✓ Image file exists at:', testImagePath);
  const stats = fs.statSync(testImagePath);
  console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB\n`);
} else {
  console.error('❌ Image file not found at:', testImagePath);
  process.exit(1);
}

// Test local backend serving (if running)
const testBackendImage = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/phishing-examples/bgs-security-email.png',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✓ Backend serves images correctly (localhost:5000)');
        resolve(true);
      } else {
        console.log(`⚠ Backend returned status ${res.statusCode} (may not be running)`);
        resolve(false);
      }
      res.on('data', () => {}); // Consume response
      res.on('end', () => {});
    });

    req.on('error', (err) => {
      console.log('⚠ Backend not running or error:', err.message);
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log('⚠ Backend request timeout (backend may not be running)');
      resolve(false);
    });

    req.end();
  });
};

testBackendImage().then(() => {
  console.log('\n✅ Image file verification complete!');
  console.log('\nImage paths should be:');
  console.log('  Development: http://localhost:5000/phishing-examples/*.png');
  console.log('  Production (Netlify): https://your-domain.netlify.app/phishing-examples/*.png');
  console.log('  Production (Backend fallback): https://bakalaurasfinal-production.up.railway.app/phishing-examples/*.png');
  process.exit(0);
});

