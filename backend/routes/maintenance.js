const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

/**
 * Maintenance endpoint to apply database changes
 * This endpoint can be called to update learning content without shell access
 */
router.post('/apply-content-changes', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('Maintenance endpoint triggered: Applying content changes...');
    console.log('='.repeat(80));
    
    const { applyAllChanges } = require('../scripts/apply-all-changes-railway');
    
    // Run the script
    await applyAllChanges();
    
    console.log('✅ Content changes applied successfully via API');
    console.log('='.repeat(80));
    
    res.json({ 
      success: true, 
      message: 'Content changes applied successfully',
      timestamp: new Date().toISOString(),
      changes: [
        'Removed references from Introduction page',
        'Split Key Concepts into 8 separate pages (one concept per page)'
      ]
    });
  } catch (error) {
    console.error('❌ Failed to apply content changes:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to apply content changes',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Diagnostic endpoint to check current database state
 */
router.get('/check-content', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Find the section
    const sectionQuery = `
      SELECT s.id, s.display_name, m.display_name as module_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;
    
    db.get(sectionQuery, [], (err, section) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }
      
      // Get all learning content
      db.all(
        'SELECT id, screen_title, order_index, read_time_min, LENGTH(content_markdown) as content_length FROM learning_content WHERE section_id = ? ORDER BY order_index',
        [section.id],
        (err, content) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', message: err.message });
          }
          
          // Check Introduction for references
          const intro = content.find(c => c.screen_title === 'Introduction');
          const hasReferences = intro && intro.content_markdown && (
            intro.content_markdown.includes('References:') || 
            intro.content_markdown.includes('## References') ||
            intro.content_markdown.includes('formatReferences')
          );
          
          // Count concept pages (should be 8 separate ones)
          const conceptPages = content.filter(c => 
            c.screen_title !== 'Introduction' && 
            !c.screen_title.toLowerCase().includes('example') &&
            c.order_index > (intro ? intro.order_index : 0)
          );
          
          res.json({
            section: {
              id: section.id,
              name: section.display_name,
              module: section.module_name
            },
            introduction: {
              exists: !!intro,
              hasReferences: hasReferences,
              orderIndex: intro?.order_index,
              contentLength: intro?.content_length
            },
            conceptPages: {
              count: conceptPages.length,
              expected: 8,
              pages: conceptPages.map(c => ({
                title: c.screen_title,
                orderIndex: c.order_index
              }))
            },
            allContent: content.map(c => ({
              id: c.id,
              title: c.screen_title,
              orderIndex: c.order_index,
              readTime: c.read_time_min
            })),
            status: {
              needsUpdate: hasReferences || conceptPages.length !== 8,
              message: hasReferences 
                ? 'Introduction still has references' 
                : conceptPages.length !== 8 
                  ? `Expected 8 concept pages, found ${conceptPages.length}`
                  : 'Content is up to date'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      error: 'Diagnostic failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
