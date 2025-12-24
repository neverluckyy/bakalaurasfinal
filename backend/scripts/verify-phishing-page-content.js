const { initDatabase, getDatabase } = require('../database/init');

async function verifyContent() {
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

    console.log('Checking all pages with "Examples" or "Phishing" in the title:\n');

    // Get all content
    const allContent = await new Promise((resolve, reject) => {
      db.all(
        'SELECT screen_title, order_index, content_markdown FROM learning_content WHERE section_id = ? ORDER BY order_index',
        [section.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    const examplePages = allContent.filter(c => 
      c.screen_title.toLowerCase().includes('example') || 
      c.screen_title.toLowerCase().includes('phishing')
    );

    examplePages.forEach(page => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Page: "${page.screen_title}" (order_index: ${page.order_index})`);
      console.log(`${'='.repeat(80)}`);
      
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      let imageCount = 0;
      const images = [];

      while ((match = imageRegex.exec(page.content_markdown)) !== null) {
        imageCount++;
        images.push({
          alt: match[1],
          path: match[2]
        });
      }

      console.log(`Content length: ${page.content_markdown.length} characters`);
      console.log(`Images found: ${imageCount}`);
      
      if (imageCount > 0) {
        console.log('\nImage references:');
        images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.path} (${img.alt})`);
        });
      } else {
        console.log('\n❌ NO IMAGES FOUND IN THIS PAGE!');
        console.log('\nFirst 500 characters of content:');
        console.log(page.content_markdown.substring(0, 500));
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyContent();


