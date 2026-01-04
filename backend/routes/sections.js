const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get section details
router.get('/:sectionId', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT 
      s.id,
      s.name,
      s.display_name,
      s.display_name as title,
      s.description,
      s.order_index,
      s.module_id,
      m.name as module_name,
      m.display_name as module_display_name
    FROM sections s
    JOIN modules m ON s.module_id = m.id
    WHERE s.id = ?
  `;

  db.get(query, [sectionId], (err, section) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  });
});

// Get questions for a section
router.get('/:sectionId/questions', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT 
      id,
      question_text,
      options,
      correct_answer,
      explanation,
      question_type
    FROM questions
    WHERE section_id = ?
    ORDER BY id
  `;

  db.all(query, [sectionId], (err, questions) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse options JSON for each question
    const questionsWithParsedOptions = questions.map(q => {
      try {
        return {
          ...q,
          options: JSON.parse(q.options || '[]')
        };
      } catch (parseError) {
        console.error('Error parsing options for question:', q.id, parseError);
        return {
          ...q,
          options: []
        };
      }
    });

    res.json(questionsWithParsedOptions);
  });
});

// Mark section as learned
router.post('/:sectionId/learn', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();
  
  // For now, just return success
  // In a real implementation, you might track learning progress
  res.json({ success: true, message: 'Section marked as learned' });
});

// Save quiz draft state (in-progress answers)
router.post('/:sectionId/quiz/draft', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const { currentQuestionIndex, draftAnswers } = req.body;
  const userId = req.user.id;
  const db = getDatabase();

  if (currentQuestionIndex === undefined || currentQuestionIndex < 0) {
    return res.status(400).json({ error: 'Valid currentQuestionIndex is required' });
  }

  const draftAnswersJson = JSON.stringify(draftAnswers || {});

  const query = `
    INSERT OR REPLACE INTO quiz_draft_state 
    (user_id, section_id, current_question_index, draft_answers, updated_at) 
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  db.run(query, [userId, sectionId, currentQuestionIndex, draftAnswersJson], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      success: true, 
      message: 'Quiz draft saved',
      currentQuestionIndex,
      draftAnswers: draftAnswers || {}
    });
  });
});

// Get quiz draft state
router.get('/:sectionId/quiz/draft', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();

  const query = `
    SELECT current_question_index, draft_answers 
    FROM quiz_draft_state 
    WHERE user_id = ? AND section_id = ?
  `;

  db.get(query, [userId, sectionId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.json({ 
        currentQuestionIndex: 0,
        draftAnswers: {}
      });
    }

    let draftAnswers = {};
    try {
      draftAnswers = row.draft_answers ? JSON.parse(row.draft_answers) : {};
    } catch (parseError) {
      console.error('Error parsing draft answers:', parseError);
      draftAnswers = {};
    }

    res.json({ 
      currentQuestionIndex: row.current_question_index || 0,
      draftAnswers
    });
  });
});

// Clear quiz draft state (after quiz completion)
router.delete('/:sectionId/quiz/draft', authenticateToken, (req, res) => {
  const { sectionId } = req.params;
  const userId = req.user.id;
  const db = getDatabase();

  const query = `
    DELETE FROM quiz_draft_state 
    WHERE user_id = ? AND section_id = ?
  `;

  db.run(query, [userId, sectionId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      success: true, 
      message: 'Quiz draft cleared'
    });
  });
});

// Submit quiz results
router.post('/:sectionId/quiz', authenticateToken, async (req, res) => {
  const { sectionId } = req.params;
  const { answers, score, totalQuestions } = req.body;
  const userId = req.user.id;
  const db = getDatabase();
  
  try {
    // Get all questions for this section
    const questions = await new Promise((resolve, reject) => {
      db.all('SELECT id, correct_answer FROM questions WHERE section_id = ?', [sectionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Track newly correct answers for XP calculation
    let newCorrectAnswers = 0;
    let allCorrectAnswers = 0;
    
    // Store each answer in user_progress table and track newly correct answers
    for (const [questionIndex, selectedAnswer] of Object.entries(answers)) {
      const questionId = questions[parseInt(questionIndex)].id;
      const correctAnswer = questions[parseInt(questionIndex)].correct_answer;
      const isCorrect = selectedAnswer === correctAnswer;
      if (isCorrect) allCorrectAnswers++;

      await new Promise((resolve, reject) => {
        // First check if there's existing progress for this question
        db.get(
          'SELECT is_correct, xp_awarded FROM user_progress WHERE user_id = ? AND question_id = ?',
          [userId, questionId],
          function(err, existingProgress) {
            if (err) {
              reject(err);
              return;
            }

            // Check if this is a newly correct answer (prevent XP farming)
            const alreadyAnsweredCorrectly = existingProgress && existingProgress.is_correct === 1;
            const alreadyEarnedXP = existingProgress && existingProgress.xp_awarded > 0;
            const isNewlyCorrect = isCorrect && !alreadyAnsweredCorrectly && !alreadyEarnedXP;
            
            if (isNewlyCorrect) {
              newCorrectAnswers++;
            }

            const questionXP = isNewlyCorrect ? 10 : 0; // Only award XP for newly correct answers

            // Only update if:
            // 1. No previous answer exists, OR
            // 2. The new answer is correct (preserve correct answers, allow improvement)
            if (!existingProgress || isCorrect) {
              db.run(
                'INSERT OR REPLACE INTO user_progress (user_id, question_id, is_correct, selected_answer, xp_awarded) VALUES (?, ?, ?, ?, ?)',
                [userId, questionId, isCorrect, selectedAnswer, questionXP],
                function(err) {
                  if (err) reject(err);
                  else resolve();
                }
              );
            } else {
              // Don't update if we already have a correct answer and the new one is wrong
              resolve();
            }
          }
        );
      });
    }
    
    // Calculate XP earned based on newly correct answers only (prevent XP farming)
    const newPercentage = totalQuestions > 0 ? (newCorrectAnswers / totalQuestions) * 100 : 0;
    let xpEarned = Math.round((newPercentage / 100) * 50); // Max 50 XP per quiz, based on new answers only
    
    // Bonus XP for perfect score (100%) - only if all answers are newly correct
    const isPerfectScore = allCorrectAnswers === totalQuestions;
    const allNewlyCorrect = newCorrectAnswers === totalQuestions;
    const bonusXP = (isPerfectScore && allNewlyCorrect) ? 25 : 0; // 25 XP bonus only for first-time perfect score
    xpEarned += bonusXP;
    
    // Clear draft state after successful submission
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM quiz_draft_state WHERE user_id = ? AND section_id = ?',
        [userId, sectionId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Update user XP and level
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET total_xp = total_xp + ?, level = FLOOR((total_xp + ?) / 100) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [xpEarned, xpEarned, userId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get updated user stats
    const userStats = await new Promise((resolve, reject) => {
      db.get('SELECT total_xp, level FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Build message with bonus info if applicable
    let message = `Quiz completed! You earned ${xpEarned} XP.`;
    if (isPerfectScore && bonusXP > 0 && allNewlyCorrect) {
      message = `Quiz completed! You earned ${xpEarned} XP (${xpEarned - bonusXP} base + ${bonusXP} perfect score bonus).`;
    } else if (newCorrectAnswers === 0 && allCorrectAnswers > 0) {
      message = `Quiz completed! You scored ${allCorrectAnswers}/${totalQuestions}, but you already earned XP for these questions. No additional XP awarded.`;
    }
    
    res.json({ 
      success: true, 
      xpEarned,
      bonusXP: bonusXP,
      isPerfectScore: isPerfectScore,
      newTotalXP: userStats.total_xp,
      newLevel: userStats.level,
      message: message
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
