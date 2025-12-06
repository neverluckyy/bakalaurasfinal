const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to check if a section is completed
function checkSectionCompletion(db, userId, sectionId) {
  return new Promise((resolve, reject) => {
    // Check learning content completion
    db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ulp.completed = 1 THEN 1 ELSE 0 END) as completed
      FROM learning_content lc
      LEFT JOIN user_learning_progress ulp ON lc.id = ulp.learning_content_id AND ulp.user_id = ?
      WHERE lc.section_id = ?`,
      [userId, sectionId],
      (err, lcResult) => {
        if (err) {
          reject(err);
          return;
        }

        const hasLearningContent = lcResult.total > 0;
        const learningContentCompleted = hasLearningContent ? (lcResult.completed === lcResult.total) : true;

        // Check quiz completion
        db.get(
          `SELECT 
            COUNT(DISTINCT q.id) as total_questions,
            COUNT(DISTINCT CASE WHEN up.is_correct = 1 THEN q.id END) as correct_answers
          FROM questions q
          LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
          WHERE q.section_id = ?`,
          [userId, sectionId],
          (err, quizResult) => {
            if (err) {
              reject(err);
              return;
            }

            const hasQuiz = quizResult.total_questions > 0;
            const quizScore = hasQuiz ? (quizResult.correct_answers / quizResult.total_questions) : 0;
            const quizPassed = quizScore >= 0.7; // 70% passing threshold

            // Section is completed if:
            // - Has learning content: all learning content completed AND (if has quiz) quiz passed
            // - No learning content but has quiz: quiz passed
            // - No learning content and no quiz: not completable (shouldn't happen, but return false)
            const sectionCompleted = hasLearningContent
              ? (learningContentCompleted && (!hasQuiz || quizPassed))
              : (hasQuiz ? quizPassed : false);

            resolve(sectionCompleted);
          }
        );
      }
    );
  });
}

// Get all modules with completion data
router.get('/', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;
  
  try {
    // Get all modules with section counts
    const modules = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          m.id,
          m.name,
          m.display_name,
          m.description,
          m.order_index,
          COUNT(DISTINCT s.id) as section_count
        FROM modules m
        LEFT JOIN sections s ON m.id = s.module_id
        GROUP BY m.id, m.name, m.display_name, m.description, m.order_index
        ORDER BY m.order_index`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Calculate progress for each module
    const modulesWithProgress = await Promise.all(modules.map(async (module) => {
      // Get all sections for this module
      const sections = await new Promise((resolve, reject) => {
        db.all(
          `SELECT id FROM sections WHERE module_id = ? ORDER BY order_index`,
          [module.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      // Check completion for each section
      let completedSections = 0;
      for (const section of sections) {
        try {
          const isCompleted = await checkSectionCompletion(db, userId, section.id);
          if (isCompleted) {
            completedSections++;
          }
        } catch (err) {
          console.error(`Error checking section ${section.id} completion:`, err);
          // Continue with other sections even if one fails
        }
      }

      return {
        ...module,
        completed_sections: completedSections,
        completion_percentage: module.section_count > 0
          ? Math.round((completedSections / module.section_count) * 100)
          : 0
      };
    }));

    res.json(modulesWithProgress);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get a single module by ID
router.get('/:moduleId', authenticateToken, async (req, res) => {
  const { moduleId } = req.params;
  const db = getDatabase();
  const userId = req.user.id;
  
  try {
    // Get module with section count
    const module = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          m.id,
          m.name,
          m.display_name as title,
          m.description,
          m.order_index,
          COUNT(DISTINCT s.id) as section_count
        FROM modules m
        LEFT JOIN sections s ON m.id = s.module_id
        WHERE m.id = ?
        GROUP BY m.id, m.name, m.display_name, m.description, m.order_index`,
        [moduleId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Get all sections for this module
    const sections = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id FROM sections WHERE module_id = ? ORDER BY order_index`,
        [moduleId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Check completion for each section
    let completedSections = 0;
    for (const section of sections) {
      try {
        const isCompleted = await checkSectionCompletion(db, userId, section.id);
        if (isCompleted) {
          completedSections++;
        }
      } catch (err) {
        console.error(`Error checking section ${section.id} completion:`, err);
        // Continue with other sections even if one fails
      }
    }

    // Calculate completion percentage
    const moduleWithProgress = {
      ...module,
      completed_sections: completedSections,
      completion_percentage: module.section_count > 0
        ? Math.round((completedSections / module.section_count) * 100)
        : 0
    };

    res.json(moduleWithProgress);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get sections for a specific module
router.get('/:moduleId/sections', authenticateToken, async (req, res) => {
  const { moduleId } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT DISTINCT
      s.id,
      s.name,
      s.display_name as title,
      s.description,
      s.order_index,
      COUNT(q.id) as question_count,
      (
        SELECT COUNT(*)
        FROM questions q2
        WHERE q2.section_id = s.id AND EXISTS (
          SELECT 1 FROM user_progress up 
          WHERE up.question_id = q2.id AND up.user_id = ? AND up.is_correct = 1
        )
      ) as correct_answers,
      (
        SELECT COUNT(*)
        FROM questions q3
        LEFT JOIN user_progress up2 ON q3.id = up2.question_id AND up2.user_id = ?
        WHERE q3.section_id = s.id
      ) as answered_questions
    FROM sections s
    LEFT JOIN questions q ON s.id = q.section_id
    WHERE s.module_id = ?
    GROUP BY s.id, s.name, s.display_name, s.description, s.order_index
    ORDER BY s.order_index
  `;

  try {
    const sections = await new Promise((resolve, reject) => {
      db.all(query, [req.user.id, req.user.id, moduleId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Calculate completion and availability for each section using consistent logic
    const sectionsWithProgress = await Promise.all(sections.map(async (section) => {
        // Use the same completion check function for consistency
        let isCompleted = false;
        try {
          isCompleted = await checkSectionCompletion(db, req.user.id, section.id);
        } catch (err) {
          console.error(`Error checking section ${section.id} completion:`, err);
          isCompleted = false;
        }
        
        // All sections are now available (section locking disabled)
        const isAvailable = true;
        
        // Calculate quiz accuracy if quiz exists
        const quizAccuracy = section.question_count > 0 
          ? Math.round((section.correct_answers / section.question_count) * 100)
          : 0;
        
        // Calculate overall completion percentage
        // If section has quiz, use quiz score; otherwise check learning content
        let completionPercentage = 0;
        if (section.question_count > 0) {
          completionPercentage = quizAccuracy;
        } else {
          // Check learning content completion percentage
          try {
            const lcResult = await new Promise((resolve, reject) => {
              db.get(
                `SELECT 
                  COUNT(*) as total,
                  SUM(CASE WHEN ulp.completed = 1 THEN 1 ELSE 0 END) as completed
                FROM learning_content lc
                LEFT JOIN user_learning_progress ulp ON lc.id = ulp.learning_content_id AND ulp.user_id = ?
                WHERE lc.section_id = ?`,
                [req.user.id, section.id],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            completionPercentage = lcResult.total > 0
              ? Math.round((lcResult.completed / lcResult.total) * 100)
              : 0;
          } catch (err) {
            completionPercentage = 0;
          }
        }
        
        return {
          ...section,
          completed: isCompleted,
          available: isAvailable,
          learned: section.answered_questions > 0 || isCompleted, // Mark as learned if user has answered questions or completed
          completion_percentage: completionPercentage,
          accuracy_percentage: section.answered_questions > 0 
            ? Math.round((section.correct_answers / section.answered_questions) * 100)
            : 0
        };
      }));

    res.json(sectionsWithProgress);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
