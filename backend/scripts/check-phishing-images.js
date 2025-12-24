const { initDatabase, getDatabase } = require('../database/init');

async function checkImages() {
  try {
    await initDatabase();
    const db = getDatabase();

    // Find Module 1, Section 1
    const section = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.id, s.display_name
        FROM sections s 
        JOIN modules m ON s.module_id = m.id 
        WHERE m.display_name = 'Security Awareness Essentials' 
        AND s.display_name = 'Phishing and Social Engineering'
        AND s.order_index = 1
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!section) {
      console.error('❌ Section not found!');
      process.exit(1);
    }

    // Get Phishing Examples content
    const content = await new Promise((resolve, reject) => {
      db.get(
        'SELECT screen_title, content_markdown, order_index FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Phishing Examples'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!content) {
      console.error('❌ Phishing Examples content not found!');
      process.exit(1);
    }

    console.log(`✓ Found Phishing Examples content (order_index: ${content.order_index})`);
    console.log('\nChecking for image references...\n');

    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let imageCount = 0;
    const images = [];

    while ((match = imageRegex.exec(content.content_markdown)) !== null) {
      imageCount++;
      images.push({
        alt: match[1],
        path: match[2]
      });
      console.log(`Image ${imageCount}:`);
      console.log(`  Alt text: ${match[1]}`);
      console.log(`  Path: ${match[2]}`);
      console.log('');
    }

    if (imageCount === 0) {
      console.error('❌ No images found in content!');
    } else {
      console.log(`✓ Found ${imageCount} image reference(s)`);
      console.log('\nImage paths to test:');
      images.forEach((img, idx) => {
        console.log(`\n${idx + 1}. ${img.path}`);
        console.log(`   Development: http://localhost:5000${img.path}`);
        console.log(`   Production: https://bakalaurasfinal-production.up.railway.app${img.path}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImages();


