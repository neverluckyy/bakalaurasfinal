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

      // Check completion for each section and if module has been started
      let completedSections = 0;
      let hasStarted = false;
      
      for (const section of sections) {
        try {
          const isCompleted = await checkSectionCompletion(db, userId, section.id);
          if (isCompleted) {
            completedSections++;
            hasStarted = true; // If any section is completed, module has been started
          }
          
          // Check if section has been started (reading position > 0 or quiz draft exists)
          if (!hasStarted) {
            // Check reading position
            const positionResult = await new Promise((resolve, reject) => {
              db.get(
                `SELECT last_step_index FROM section_reading_position 
                 WHERE user_id = ? AND section_id = ?`,
                [userId, section.id],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            
            if (positionResult && positionResult.last_step_index > 0) {
              hasStarted = true;
            }
            
            // Check quiz draft state if no reading position found
            if (!hasStarted) {
              const draftResult = await new Promise((resolve, reject) => {
                db.get(
                  `SELECT COUNT(*) as count FROM quiz_draft_state 
                   WHERE user_id = ? AND section_id = ?`,
                  [userId, section.id],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                  }
                );
              });
              
              if (draftResult && draftResult.count > 0) {
                hasStarted = true;
              }
            }
            
            // Check if user has any learning progress for this section
            if (!hasStarted) {
              const learningProgressResult = await new Promise((resolve, reject) => {
                db.get(
                  `SELECT COUNT(*) as count FROM user_learning_progress ulp
                   JOIN learning_content lc ON ulp.learning_content_id = lc.id
                   WHERE ulp.user_id = ? AND lc.section_id = ?`,
                  [userId, section.id],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                  }
                );
              });
              
              if (learningProgressResult && learningProgressResult.count > 0) {
                hasStarted = true;
              }
            }
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
          : 0,
        has_started: hasStarted
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

    // Check completion for each section and if module has been started
    let completedSections = 0;
    let hasStarted = false;
    
    for (const section of sections) {
      try {
        const isCompleted = await checkSectionCompletion(db, userId, section.id);
        if (isCompleted) {
          completedSections++;
          hasStarted = true; // If any section is completed, module has been started
        }
        
        // Check if section has been started (reading position > 0 or quiz draft exists)
        if (!hasStarted) {
          // Check reading position
          const positionResult = await new Promise((resolve, reject) => {
            db.get(
              `SELECT last_step_index FROM section_reading_position 
               WHERE user_id = ? AND section_id = ?`,
              [userId, section.id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });
          
          if (positionResult && positionResult.last_step_index > 0) {
            hasStarted = true;
          }
          
          // Check quiz draft state if no reading position found
          if (!hasStarted) {
            const draftResult = await new Promise((resolve, reject) => {
              db.get(
                `SELECT COUNT(*) as count FROM quiz_draft_state 
                 WHERE user_id = ? AND section_id = ?`,
                [userId, section.id],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            
            if (draftResult && draftResult.count > 0) {
              hasStarted = true;
            }
          }
          
          // Check if user has any learning progress for this section
          if (!hasStarted) {
            const learningProgressResult = await new Promise((resolve, reject) => {
              db.get(
                `SELECT COUNT(*) as count FROM user_learning_progress ulp
                 JOIN learning_content lc ON ulp.learning_content_id = lc.id
                 WHERE ulp.user_id = ? AND lc.section_id = ?`,
                [userId, section.id],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            
            if (learningProgressResult && learningProgressResult.count > 0) {
              hasStarted = true;
            }
          }
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
        : 0,
      has_started: hasStarted
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
    const sectionsWithProgress = await Promise.all(sections.map(async (section, index) => {
        // Use the same completion check function for consistency
        let isCompleted = false;
        try {
          isCompleted = await checkSectionCompletion(db, req.user.id, section.id);
        } catch (err) {
          console.error(`Error checking section ${section.id} completion:`, err);
          isCompleted = false;
        }
        
        // Store completion status for sequential locking check
        const completionStatus = isCompleted;
        
        // Check if learning content is completed
        let learningCompleted = false;
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
          learningCompleted = lcResult.total > 0 && lcResult.completed === lcResult.total;
        } catch (err) {
          learningCompleted = false;
        }
        
        // Check if quiz has been attempted (answered questions or has draft state)
        let quizAttempted = false;
        let quizFailedOrStopped = false;
        let hasDraftState = false;
        
        if (section.question_count > 0) {
          // Check if user has answered any questions
          quizAttempted = section.answered_questions > 0;
          
          // Check if quiz has draft state (stopped/incomplete)
          try {
            const draftResult = await new Promise((resolve, reject) => {
              db.get(
                `SELECT COUNT(*) as count 
                FROM quiz_draft_state 
                WHERE user_id = ? AND section_id = ?`,
                [req.user.id, section.id],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            if (draftResult && draftResult.count > 0) {
              quizAttempted = true;
              hasDraftState = true;
            }
          } catch (err) {
            // Ignore errors
          }
          
          // Check if quiz was failed (score < 70%) or stopped
          if (quizAttempted) {
            const quizScore = section.question_count > 0 
              ? (section.correct_answers / section.question_count) * 100
              : 0;
            const quizPassed = quizScore >= 70;
            
            // Quiz failed if score < 70%, or stopped if draft exists (incomplete attempt)
            // Note: If quiz was completed and passed, isCompleted will be true and quizPassed will be true
            if (!quizPassed || hasDraftState) {
              quizFailedOrStopped = true;
            }
          }
        }
        
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
          completed: completionStatus,
          sectionIndex: index, // Store index for sequential locking
          learned: section.answered_questions > 0 || completionStatus, // Mark as learned if user has answered questions or completed
          completion_percentage: completionPercentage,
          accuracy_percentage: section.answered_questions > 0 
            ? Math.round((section.correct_answers / section.answered_questions) * 100)
            : 0,
          learning_completed: learningCompleted,
          quiz_attempted: quizAttempted,
          quiz_failed_or_stopped: quizFailedOrStopped
        };
      }));
    
    // Apply sequential locking: first section is always available, others require previous section to be completed
    const sectionsWithLocking = sectionsWithProgress.map((section, index) => {
      let isAvailable = false;
      
      if (index === 0) {
        // First section is always available
        isAvailable = true;
      } else {
        // Section is available if previous section is completed
        const previousSection = sectionsWithProgress[index - 1];
        isAvailable = previousSection.completed === true;
      }
      
      return {
        ...section,
        available: isAvailable
      };
    });

    res.json(sectionsWithLocking);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
