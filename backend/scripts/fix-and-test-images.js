const { initDatabase, getDatabase } = require('../database/init');
const path = require('path');
const fs = require('fs');

/**
 * Script to verify and ensure images are properly referenced in the database
 * This also tests that image paths are correct
 */

async function fixAndTestImages() {
  try {
    await initDatabase();
    const db = getDatabase();

    // Find Module 1, Section 1
    const findSectionQuery = `
      SELECT s.id, s.display_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;

    const section = await new Promise((resolve, reject) => {
      db.get(findSectionQuery, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!section) {
      console.error('❌ Section not found!');
      process.exit(1);
    }

    // Check if images exist in the public folder
    // __dirname is backend/scripts, so go up two levels to root, then to frontend/public
    const publicImagesPath = path.join(__dirname, '../../frontend/public/phishing-examples');
    const imageFiles = [
      'bgs-security-email.png',
      'bgs-security-website.png',
      'office365-email.png',
      'office365-website.png',
      'sharefile-email.png',
      'sharefile-website.png'
    ];

    console.log('Checking if image files exist...\n');
    const missingImages = [];
    imageFiles.forEach(filename => {
      const filePath = path.join(publicImagesPath, filename);
      if (fs.existsSync(filePath)) {
        console.log(`✓ ${filename}`);
      } else {
        console.log(`❌ ${filename} - MISSING!`);
        missingImages.push(filename);
      }
    });

    if (missingImages.length > 0) {
      console.error(`\n❌ ${missingImages.length} image(s) are missing!`);
      process.exit(1);
    }

    console.log('\n✓ All images exist in public folder\n');

    // Get Real-World Examples content
    const content = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, screen_title, content_markdown, order_index FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!content) {
      console.error('❌ Real-World Examples content not found!');
      console.log('Running add-phishing-examples.js script...\n');
      // Re-run the script to add it
      require('./add-phishing-examples.js');
      return;
    }

    console.log(`✓ Found Real-World Examples content (ID: ${content.id}, order_index: ${content.order_index})`);
    
    // Verify image paths in content
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let imageCount = 0;
    const imagePaths = [];

    while ((match = imageRegex.exec(content.content_markdown)) !== null) {
      imageCount++;
      const imagePath = match[2];
      imagePaths.push(imagePath);
      
      // Check if path starts with /phishing-examples/
      if (!imagePath.startsWith('/phishing-examples/')) {
        console.error(`⚠ Warning: Image path "${imagePath}" doesn't start with /phishing-examples/`);
      }
    }

    if (imageCount === 0) {
      console.error('❌ No images found in content!');
      console.log('Re-adding Real-World Examples content...\n');
      // Delete and re-add
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM learning_content WHERE id = ?',
          [content.id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      require('./add-phishing-examples.js');
      return;
    }

    console.log(`✓ Content has ${imageCount} image reference(s)`);
    console.log('\nAll image paths:');
    imagePaths.forEach((path, idx) => {
      console.log(`  ${idx + 1}. ${path}`);
    });

    console.log('\n✅ All checks passed! Images should be visible.');
    console.log('\nTo test:');
    console.log('1. Start the backend server');
    console.log('2. Navigate to Module 1, Section 1');
    console.log('3. Go to the "Real-World Examples" page');
    console.log('4. Images should load from /phishing-examples/ paths');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAndTestImages();

