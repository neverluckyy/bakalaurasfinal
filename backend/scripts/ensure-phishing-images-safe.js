const fs = require('fs');
const path = require('path');

/**
 * Safe script to ensure phishing example images exist
 * This script only checks and logs - it does NOT crash the server
 * Run this on startup to verify images are available
 */

async function ensurePhishingImagesSafe() {
  console.log('='.repeat(80));
  console.log('CHECKING PHISHING EXAMPLE IMAGES');
  console.log('='.repeat(80));
  
  const requiredImages = [
    'bgs-security-email.png',
    'bgs-security-website.png',
    'office365-email.png',
    'office365-website.png',
    'sharefile-email.png',
    'sharefile-website.png'
  ];
  
  // Check both backend/public and frontend/public
  const backendPath = path.join(__dirname, '../public/phishing-examples');
  const frontendPath = path.join(__dirname, '../../frontend/public/phishing-examples');
  
  const backendExists = fs.existsSync(backendPath);
  const frontendExists = fs.existsSync(frontendPath);
  
  console.log(`Backend images path: ${backendPath} - ${backendExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  console.log(`Frontend images path: ${frontendPath} - ${frontendExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  console.log('');
  
  let allImagesFound = true;
  const missingImages = [];
  
  // Check backend images first (Railway production)
  if (backendExists) {
    console.log('Checking backend images:');
    requiredImages.forEach(imageName => {
      const imagePath = path.join(backendPath, imageName);
      const exists = fs.existsSync(imagePath);
      if (exists) {
        const stats = fs.statSync(imagePath);
        console.log(`  ✅ ${imageName} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`  ❌ ${imageName} - MISSING`);
        missingImages.push({ name: imageName, location: 'backend' });
        allImagesFound = false;
      }
    });
  } else {
    console.log('⚠️  Backend images directory does not exist');
    allImagesFound = false;
  }
  
  console.log('');
  
  // Check frontend images (fallback for local dev)
  if (frontendExists) {
    console.log('Checking frontend images:');
    requiredImages.forEach(imageName => {
      const imagePath = path.join(frontendPath, imageName);
      const exists = fs.existsSync(imagePath);
      if (exists) {
        const stats = fs.statSync(imagePath);
        console.log(`  ✅ ${imageName} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`  ❌ ${imageName} - MISSING`);
        if (!missingImages.find(m => m.name === imageName)) {
          missingImages.push({ name: imageName, location: 'frontend' });
        }
        allImagesFound = false;
      }
    });
  } else {
    console.log('⚠️  Frontend images directory does not exist');
  }
  
  console.log('');
  console.log('='.repeat(80));
  
  if (allImagesFound) {
    console.log('✅ ALL PHISHING EXAMPLE IMAGES ARE AVAILABLE');
    console.log('='.repeat(80));
    return { success: true, allFound: true };
  } else {
    console.log('⚠️  SOME IMAGES ARE MISSING (non-fatal)');
    console.log('Missing images:', missingImages.map(m => m.name).join(', '));
    console.log('Images will not display, but server will continue running.');
    console.log('='.repeat(80));
    return { success: true, allFound: false, missing: missingImages };
  }
}

// Export for use in server.js
module.exports = ensurePhishingImagesSafe;

// If run directly, execute it
if (require.main === module) {
  ensurePhishingImagesSafe()
    .then(result => {
      if (result.allFound) {
        console.log('\n✅ All images found - exiting successfully');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some images missing - but this is non-fatal');
        process.exit(0); // Exit with 0 even if images are missing - don't crash
      }
    })
    .catch(error => {
      console.error('Error checking images:', error);
      console.error('This is non-fatal - server will continue');
      process.exit(0); // Don't crash even on error
    });
}

