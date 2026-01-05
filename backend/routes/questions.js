const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get next unanswered question for a section
router.get('/sections/:sectionId/next', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT 
      q.id,
      q.question_text,
      q.options,
      q.question_type
    FROM questions q
    WHERE q.section_id = ?
    AND q.id NOT IN (
      SELECT question_id 
      FROM user_progress 
      WHERE user_id = ?
    )
    ORDER BY q.id
    LIMIT 1
  `;

  db.get(query, [sectionId, req.user.id], (err, question) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ error: 'No more questions available for this section' });
    }

    // Parse options JSON
    try {
      question.options = JSON.parse(question.options);
    } catch (e) {
      console.error('Error parsing options:', e);
      return res.status(500).json({ error: 'Invalid question data' });
    }

    res.json({ question });
  });
});

// Get specific question (without correct answer)
router.get('/:questionId', authenticateToken, (req, res) => {
  const { questionId } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT 
      q.id,
      q.question_text,
      q.options,
      q.question_type,
      s.display_name as section_name,
      m.display_name as module_name
    FROM questions q
    JOIN sections s ON q.section_id = s.id
    JOIN modules m ON s.module_id = m.id
    WHERE q.id = ?
  `;

  db.get(query, [questionId], (err, question) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Parse options JSON
    try {
      question.options = JSON.parse(question.options);
    } catch (e) {
      console.error('Error parsing options:', e);
      return res.status(500).json({ error: 'Invalid question data' });
    }

    res.json({ question });
  });
});

// Submit answer to a question
router.post('/:questionId/answer', authenticateToken, async (req, res) => {
  const { questionId } = req.params;
  const { selectedIndex } = req.body;

  if (selectedIndex === undefined || selectedIndex < 0) {
    return res.status(400).json({ error: 'Valid selectedIndex is required' });
  }

  const db = getDatabase();
  
  // Get question details
  db.get(
    'SELECT id, section_id, options, correct_answer, explanation FROM questions WHERE id = ?',
    [questionId],
    async (err, question) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Parse options to get the selected answer
      let options;
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        console.error('Error parsing options:', e);
        return res.status(500).json({ error: 'Invalid question data' });
      }

      if (selectedIndex >= options.length) {
        return res.status(400).json({ error: 'Invalid selectedIndex' });
      }

      const selectedAnswer = options[selectedIndex];
      const isCorrect = selectedAnswer === question.correct_answer;
      const xpAwarded = isCorrect ? 10 : 0;

      // Check if XP was already awarded in any previous attempt (prevent XP farming)
      // Track history of every question attempted by checking SUM of xp_awarded
      db.get(
        'SELECT SUM(xp_awarded) as total_xp_awarded FROM user_progress WHERE user_id = ? AND question_id = ?',
        [req.user.id, questionId],
        function(err, progressSummary) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to check existing progress' });
          }

          // Calculate XP to award: only if no XP was awarded in any previous attempt
          // This prevents XP farming by checking the history of all attempts
          const totalXPAwarded = progressSummary?.total_xp_awarded || 0;
          const shouldAwardXP = totalXPAwarded === 0 && isCorrect;
          const actualXPAwarded = shouldAwardXP ? xpAwarded : 0;

          // Always INSERT a new attempt to track history (one-to-many relationship)
          // This records every question attempt, not just the latest
          db.run(
            'INSERT INTO user_progress (user_id, question_id, is_correct, selected_answer, xp_awarded) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, questionId, isCorrect, selectedAnswer, actualXPAwarded],
            function(err) {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({ error: 'Failed to save progress' });
                }

                // Update user's total XP and level (only if XP should be awarded)
                if (actualXPAwarded > 0) {
                  db.run(
                    'UPDATE users SET total_xp = total_xp + ?, level = FLOOR((total_xp + ?) / 100) + 1 WHERE id = ?',
                    [actualXPAwarded, actualXPAwarded, req.user.id],
                    (err) => {
                      if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to update user stats' });
                      }

                      // Get updated user stats
                      db.get(
                        'SELECT total_xp, level FROM users WHERE id = ?',
                        [req.user.id],
                        (err, userStats) => {
                          if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Failed to get user stats' });
                          }

                          // Get section progress (handle multiple attempts per question)
                          db.get(
                            `SELECT 
                              COUNT(DISTINCT q.id) as total_questions,
                              COUNT(DISTINCT CASE WHEN up.is_correct = 1 THEN q.id END) as correct_answers
                            FROM questions q
                            LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
                            WHERE q.section_id = ?`,
                            [req.user.id, question.section_id],
                            (err, sectionProgress) => {
                              if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ error: 'Failed to get section progress' });
                              }

                              const response = {
                                isCorrect,
                                correctAnswer: question.correct_answer,
                                explanation: question.explanation,
                                xpAwarded: actualXPAwarded,
                                totalXp: userStats.total_xp,
                                newLevel: userStats.level,
                                sectionProgress: {
                                  totalQuestions: sectionProgress.total_questions,
                                  correctAnswers: sectionProgress.correct_answers,
                                  percentage: sectionProgress.total_questions > 0 
                                    ? Math.round((sectionProgress.correct_answers / sectionProgress.total_questions) * 100)
                                    : 0
                                }
                              };

                              res.json(response);
                            }
                          );
                        }
                      );
                    }
                  );
                } else {
                  // No XP to add, just return the existing stats without updating XP
                  db.get(
                    'SELECT total_xp, level FROM users WHERE id = ?',
                    [req.user.id],
                    (err, userStats) => {
                      if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to get user stats' });
                      }

                      db.get(
                        `SELECT 
                          COUNT(DISTINCT q.id) as total_questions,
                          COUNT(DISTINCT CASE WHEN up.is_correct = 1 THEN q.id END) as correct_answers
                        FROM questions q
                        LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
                        WHERE q.section_id = ?`,
                        [req.user.id, question.section_id],
                        (err, sectionProgress) => {
                          if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Failed to get section progress' });
                          }

                          const response = {
                            isCorrect,
                            correctAnswer: question.correct_answer,
                            explanation: question.explanation,
                            xpAwarded: 0,
                            totalXp: userStats.total_xp,
                            newLevel: userStats.level,
                            sectionProgress: {
                              totalQuestions: sectionProgress.total_questions,
                              correctAnswers: sectionProgress.correct_answers,
                              percentage: sectionProgress.total_questions > 0 
                                ? Math.round((sectionProgress.correct_answers / sectionProgress.total_questions) * 100)
                                : 0
                            }
                          };

                          if (totalXPAwarded > 0) {
                            response.message = 'XP already awarded for this question in a previous attempt';
                          }

                          res.json(response);
                        }
                      );
                    }
                  );
                }
              }
            );
        }
      );
    }
  );
});

module.exports = router;
