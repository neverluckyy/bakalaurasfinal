const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get learning content for a specific section
router.get('/section/:sectionId', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT 
      lc.id,
      lc.screen_title,
      lc.read_time_min,
      lc.content_markdown,
      lc.order_index,
      s.display_name as section_name,
      m.display_name as module_name
    FROM learning_content lc
    JOIN sections s ON lc.section_id = s.id
    JOIN modules m ON s.module_id = m.id
    WHERE lc.section_id = ?
    ORDER BY lc.order_index
  `;

  db.all(query, [sectionId], (err, content) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return empty array if no content exists (section might be newly created)
    res.json(content || []);
  });
});

// Mark learning content as completed
router.post('/:contentId/complete', authenticateToken, (req, res) => {
  const { contentId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();
  
  const query = `
    INSERT OR REPLACE INTO user_learning_progress 
    (user_id, learning_content_id, completed, completed_at) 
    VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
  `;

  db.run(query, [userId, contentId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      success: true, 
      message: 'Learning content marked as completed' 
    });
  });
});

// Mark ALL learning content in a section as completed
// This is used when a user finishes a section so completion/unlocking logic can work reliably,
// even if they jumped around using saved reading position.
router.post('/section/:sectionId/complete', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();

  const selectQuery = `
    SELECT id
    FROM learning_content
    WHERE section_id = ?
  `;

  db.all(selectQuery, [sectionId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const contentIds = (rows || []).map(r => r.id);
    if (contentIds.length === 0) {
      // Nothing to mark; treat as success
      return res.json({
        success: true,
        message: 'No learning content to complete for this section',
        completedCount: 0
      });
    }

    const insertQuery = `
      INSERT OR REPLACE INTO user_learning_progress
      (user_id, learning_content_id, completed, completed_at)
      VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      let failed = false;

      contentIds.forEach((contentId) => {
        db.run(insertQuery, [userId, contentId], (insertErr) => {
          if (failed) return;
          if (insertErr) {
            failed = true;
            console.error('Database error:', insertErr);
            db.run('ROLLBACK', () => {
              res.status(500).json({ error: 'Database error' });
            });
          }
        });
      });

      // Commit once all queued statements have finished
      db.run('COMMIT', (commitErr) => {
        if (failed) return;
        if (commitErr) {
          console.error('Database error:', commitErr);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          success: true,
          message: 'Section learning content marked as completed',
          completedCount: contentIds.length
        });
      });
    });
  });
});

// Get user's learning progress for a section
router.get('/section/:sectionId/progress', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();
  
  const query = `
    SELECT 
      lc.id,
      lc.screen_title,
      ulp.completed,
      ulp.completed_at
    FROM learning_content lc
    LEFT JOIN user_learning_progress ulp ON lc.id = ulp.learning_content_id AND ulp.user_id = ?
    WHERE lc.section_id = ?
    ORDER BY lc.order_index
  `;

  db.all(query, [userId, sectionId], (err, progress) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Handle case where section has no learning content yet
    const progressData = progress || [];
    const completedCount = progressData.filter(p => p.completed).length;
    const totalCount = progressData.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    res.json({
      progress: progressData,
      completedCount,
      totalCount,
      completionPercentage
    });
  });
});

// Save reading position for a section
router.post('/section/:sectionId/position', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const { stepIndex } = req.body;
  const userId = req.user.id;
  const db = getDatabase();

  if (stepIndex === undefined || stepIndex < 0) {
    return res.status(400).json({ error: 'Valid stepIndex is required' });
  }

  const query = `
    INSERT OR REPLACE INTO section_reading_position 
    (user_id, section_id, last_step_index, updated_at) 
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `;

  db.run(query, [userId, sectionId, stepIndex], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      success: true, 
      message: 'Reading position saved',
      stepIndex 
    });
  });
});

// Get reading position for a section
router.get('/section/:sectionId/position', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();

  const query = `
    SELECT last_step_index 
    FROM section_reading_position 
    WHERE user_id = ? AND section_id = ?
  `;

  db.get(query, [userId, sectionId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      stepIndex: row ? row.last_step_index : 0 
    });
  });
});

module.exports = router;
