const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

/**
 * Endpoint to manually trigger phishing examples page creation
 * POST /api/maintenance/add-phishing-examples-page
 */
router.post('/add-phishing-examples-page', async (req, res) => {
  try {
    const addPhishingExamplesPage = require('../scripts/add-phishing-examples-page');
    const result = await addPhishingExamplesPage();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error adding phishing examples page:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * Diagnostic endpoint to check current database state
 */
router.get('/check-content', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Find Module 1, Section 1
    const sectionQuery = `
      SELECT s.id, s.display_name, s.order_index, m.id as module_id, m.display_name as module_name
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
          
          // Check for Real-World Examples page
          const examplesPage = content.find(c => c.screen_title === 'Real-World Examples');
          
          res.json({
            section: {
              id: section.id,
              name: section.display_name,
              module: section.module_name,
              order_index: section.order_index
            },
            learningContent: {
              total: content.length,
              pages: content.map(c => ({
                id: c.id,
                title: c.screen_title,
                order_index: c.order_index,
                content_length: c.content_length,
                has_images: c.content_markdown && c.content_markdown.includes('![') ? 'yes' : 'no'
              }))
            },
            examplesPage: examplesPage ? {
              id: examplesPage.id,
              order_index: examplesPage.order_index,
              has_content: examplesPage.content_length > 0,
              has_images: examplesPage.content_markdown && examplesPage.content_markdown.includes('![') ? 'yes' : 'no'
            } : null,
            summary: {
              hasIntroduction: !!intro,
              hasReferences: hasReferences,
              conceptPageCount: conceptPages.length,
              hasExamplesPage: !!examplesPage
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * Endpoint to manually ensure phishing examples page exists
 * POST /api/maintenance/ensure-phishing-examples
 * Optionally accepts { force: true } in body to force update even if page exists
 */
router.post('/ensure-phishing-examples', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('MANUALLY TRIGGERING PHISHING EXAMPLES PAGE UPDATE');
    console.log('='.repeat(80));
    
    const { force } = req.body || {};
    if (force) {
      console.log('Force update requested - will update content even if page exists');
    }
    
    const ensurePhishingExamples = require('../scripts/ensure-phishing-examples-on-railway');
    const result = await ensurePhishingExamples();
    
    console.log('Result:', result);
    console.log('='.repeat(80));
    
    res.json({ 
      success: true, 
      result,
      message: `Phishing examples page ${result.action || 'updated'}`
    });
  } catch (error) {
    console.error('Error ensuring phishing examples:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
});

/**
 * Endpoint to force delete and recreate phishing examples page
 * POST /api/maintenance/force-update-phishing-examples
 */
router.post('/force-update-phishing-examples', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('FORCE UPDATING PHISHING EXAMPLES PAGE');
    console.log('='.repeat(80));
    
    const db = getDatabase();
    
    // Find the section
    const section = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.id, s.display_name
        FROM sections s 
        JOIN modules m ON s.module_id = m.id 
        WHERE m.display_name = 'Security Awareness Essentials' 
        AND s.display_name = 'Phishing and Social Engineering'
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    // Delete existing page
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM learning_content WHERE section_id = ? AND screen_title = ?',
        [section.id, 'Real-World Examples'],
        function(err) {
          if (err) reject(err);
          else {
            console.log(`✓ Deleted existing "Real-World Examples" page`);
            resolve();
          }
        }
      );
    });
    
    // Now create it fresh
    const ensurePhishingExamples = require('../scripts/ensure-phishing-examples-on-railway');
    const result = await ensurePhishingExamples();
    
    res.json({ 
      success: true, 
      result,
      message: 'Phishing examples page force updated'
    });
  } catch (error) {
    console.error('Error force updating phishing examples:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
});

/**
 * Get all sections with their IDs for debugging
 */
router.get('/sections', (req, res) => {
  try {
    const db = getDatabase();
    
    db.all(`
      SELECT 
        s.id,
        s.display_name,
        s.order_index,
        m.id as module_id,
        m.display_name as module_name,
        (SELECT COUNT(*) FROM learning_content WHERE section_id = s.id) as content_count
      FROM sections s
      JOIN modules m ON s.module_id = m.id
      ORDER BY m.id, s.order_index
    `, [], (err, sections) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      res.json({ sections });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
