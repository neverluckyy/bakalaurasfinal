/**
 * Image Diagnostics Utility
 * Add this to your browser console to debug image loading issues
 */

export const diagnoseImageLoading = () => {
  console.log('=== IMAGE LOADING DIAGNOSTICS ===\n');
  
  // Check axios configuration
  const axios = require('axios');
  console.log('1. Axios Configuration:');
  console.log('   baseURL:', axios.defaults.baseURL || '(not set)');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   REACT_APP_API_URL:', process.env.REACT_APP_API_URL || '(not set)');
  console.log('');
  
  // Test image URLs
  const testImages = [
    '/phishing-examples/bgs-security-email.png',
    '/phishing-examples/bgs-security-website.png',
    '/phishing-examples/office365-email.png'
  ];
  
  console.log('2. Testing Image URLs:');
  testImages.forEach((path, idx) => {
    const backendUrl = axios.defaults.baseURL || 'https://bakalaurasfinal-production.up.railway.app';
    const fullUrl = `${backendUrl}${path}`;
    console.log(`\n   Image ${idx + 1}: ${path}`);
    console.log(`   Full URL: ${fullUrl}`);
    
    // Try to fetch the image
    fetch(fullUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => console.log(`   ✓ Accessible (CORS check)`))
      .catch(err => console.log(`   ✗ Error: ${err.message}`));
  });
  
  console.log('\n3. Check Network Tab:');
  console.log('   - Open DevTools → Network tab');
  console.log('   - Filter by "Img"');
  console.log('   - Look for requests to /phishing-examples/');
  console.log('   - Check status codes (should be 200)');
  console.log('   - Check if URLs are correct');
  
  console.log('\n4. Image Elements on Page:');
  const images = document.querySelectorAll('img[src*="phishing-examples"]');
  console.log(`   Found ${images.length} phishing example images`);
  images.forEach((img, idx) => {
    console.log(`\n   Image ${idx + 1}:`);
    console.log(`   - src: ${img.src}`);
    console.log(`   - alt: ${img.alt}`);
    console.log(`   - complete: ${img.complete}`);
    console.log(`   - naturalWidth: ${img.naturalWidth}`);
    console.log(`   - naturalHeight: ${img.naturalHeight}`);
    if (img.naturalWidth === 0) {
      console.log(`   ⚠️ Image failed to load (naturalWidth is 0)`);
    }
  });
  
  console.log('\n=== END DIAGNOSTICS ===');
};

// Make it available globally in development
if (process.env.NODE_ENV === 'development') {
  window.diagnoseImageLoading = diagnoseImageLoading;
}


