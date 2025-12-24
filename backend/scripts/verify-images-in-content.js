const { initDatabase, getDatabase } = require('../database/init');

/**
 * Script to verify that Real-World Examples content has images
 * and check the content in the database
 */

async function verifyImages() {
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

    // Get Real-World Examples content
    const content = await new Promise((resolve, reject) => {
      db.get(
        'SELECT screen_title, content_markdown, order_index FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!content) {
      console.error('❌ Real-World Examples content not found!');
      process.exit(1);
    }

    console.log(`✓ Found Real-World Examples content (order_index: ${content.order_index})`);
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
      console.log('\nContent preview (first 500 chars):');
      console.log(content.content_markdown.substring(0, 500));
    } else {
      console.log(`✓ Found ${imageCount} image reference(s)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyImages();


