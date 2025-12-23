const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { validatePassword, validateEmail, validateDisplayName } = require('../utils/passwordValidation');
const { generateToken, sendEmailChangeVerificationEmail, sendEmailChangeNotification } = require('../utils/emailService');

const router = express.Router();

// Get user statistics
// IMPORTANT: these counts should match the same completion rules used for unlocking sections/modules.
router.get('/stats', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;
  const PASSING_THRESHOLD = 0.7; // keep consistent with backend/routes/modules.js

  try {
    // Basic quiz stats
    const stats = await new Promise((resolve, reject) => {
      db.get(
        `
          SELECT
            COUNT(DISTINCT up.question_id) as questions_answered,
            SUM(CASE WHEN up.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
            SUM(up.xp_awarded) as total_xp_earned
          FROM user_progress up
          WHERE up.user_id = ?
        `,
        [userId],
        (err, row) => (err ? reject(err) : resolve(row || {}))
      );
    });

    // Fetch modules + sections once, then compute counts in JS using the same semantics
    const modules = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id FROM modules ORDER BY order_index`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    const sections = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, module_id FROM sections ORDER BY module_id, order_index`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    // Helper: compute status for a section
    const getSectionStatus = async (sectionId) => {
      // Learning content completion
      const lc = await new Promise((resolve, reject) => {
        db.get(
          `
            SELECT
              COUNT(*) as total,
              SUM(CASE WHEN ulp.completed = 1 THEN 1 ELSE 0 END) as completed
            FROM learning_content lc
            LEFT JOIN user_learning_progress ulp
              ON lc.id = ulp.learning_content_id AND ulp.user_id = ?
            WHERE lc.section_id = ?
          `,
          [userId, sectionId],
          (err, row) => (err ? reject(err) : resolve(row || { total: 0, completed: 0 }))
        );
      });

      const hasLearningContent = (lc.total || 0) > 0;
      const learningContentCompleted = hasLearningContent ? (lc.completed === lc.total) : true;

      // Quiz completion (passed if >= 70% correct across section questions)
      const quiz = await new Promise((resolve, reject) => {
        db.get(
          `
            SELECT
              COUNT(DISTINCT q.id) as total_questions,
              COUNT(DISTINCT CASE WHEN up.is_correct = 1 THEN q.id END) as correct_answers
            FROM questions q
            LEFT JOIN user_progress up
              ON q.id = up.question_id AND up.user_id = ?
            WHERE q.section_id = ?
          `,
          [userId, sectionId],
          (err, row) => (err ? reject(err) : resolve(row || { total_questions: 0, correct_answers: 0 }))
        );
      });

      const hasQuiz = (quiz.total_questions || 0) > 0;
      const quizScore = hasQuiz ? (quiz.correct_answers / quiz.total_questions) : 0;
      const quizPassed = quizScore >= PASSING_THRESHOLD;

      // Profile semantics (what users expect on stats cards):
      // - If there is a quiz: passing the quiz means the section is completed.
      // - If there is no quiz: completing learning content means the section is completed.
      // This intentionally differs from the sequential unlock logic, which may require both.
      const sectionCompleted = hasQuiz ? quizPassed : (hasLearningContent ? learningContentCompleted : false);

      return { sectionCompleted, hasQuiz, quizPassed };
    };

    // Compute section statuses
    const statusBySectionId = new Map();
    let sectionsCompleted = 0;
    let quizzesPassed = 0;

    for (const s of sections) {
      const status = await getSectionStatus(s.id);
      statusBySectionId.set(s.id, status);
      if (status.sectionCompleted) sectionsCompleted += 1;
      if (status.hasQuiz && status.quizPassed) quizzesPassed += 1;
    }

    // Compute modules completed: every section in that module must be completed
    let modulesCompleted = 0;
    for (const m of modules) {
      const moduleSections = sections.filter(s => s.module_id === m.id);
      if (moduleSections.length === 0) continue;
      const allDone = moduleSections.every(s => statusBySectionId.get(s.id)?.sectionCompleted === true);
      if (allDone) modulesCompleted += 1;
    }

    // Days active: count distinct days across quiz answering + learning activity
    const daysActiveRow = await new Promise((resolve, reject) => {
      db.get(
        `
          SELECT COUNT(DISTINCT day) as days_active
          FROM (
            SELECT DATE(up.answered_at) as day
            FROM user_progress up
            WHERE up.user_id = ? AND up.answered_at IS NOT NULL
            UNION
            SELECT DATE(ulp.completed_at) as day
            FROM user_learning_progress ulp
            WHERE ulp.user_id = ? AND ulp.completed_at IS NOT NULL
            UNION
            SELECT DATE(srp.updated_at) as day
            FROM section_reading_position srp
            WHERE srp.user_id = ? AND srp.updated_at IS NOT NULL
          )
        `,
        [userId, userId, userId],
        (err, row) => (err ? reject(err) : resolve(row || { days_active: 0 }))
      );
    });

    res.json({
      modulesCompleted,
      sectionsCompleted,
      quizzesPassed,
      daysActive: daysActiveRow.days_active || 0,
      totalQuestionsAnswered: stats?.questions_answered || 0,
      totalCorrectAnswers: stats?.correct_answers || 0,
      totalXPEarned: stats?.total_xp_earned || 0
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;
  
  // Get user's XP and level
  const userQuery = `SELECT total_xp, level FROM users WHERE id = ?`;
  
  db.get(userQuery, [userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Define achievements based on user progress
    const achievements = [
      {
        id: 1,
        title: 'First Steps',
        description: 'Complete your first quiz',
        earned: (user?.total_xp || 0) > 0,
        earnedAt: user?.total_xp > 0 ? new Date().toISOString() : null
      },
      {
        id: 2,
        title: 'Knowledge Seeker',
        description: 'Reach Level 5',
        earned: (user?.level || 0) >= 5,
        earnedAt: user?.level >= 5 ? new Date().toISOString() : null
      },
      {
        id: 3,
        title: 'Security Enthusiast',
        description: 'Reach Level 10',
        earned: (user?.level || 0) >= 10,
        earnedAt: user?.level >= 10 ? new Date().toISOString() : null
      },
      {
        id: 4,
        title: 'XP Collector',
        description: 'Earn 500 XP',
        earned: (user?.total_xp || 0) >= 500,
        earnedAt: user?.total_xp >= 500 ? new Date().toISOString() : null
      },
      {
        id: 5,
        title: 'Quiz Master',
        description: 'Answer 50 questions correctly',
        earned: false, // This would need to be calculated from user_progress
        earnedAt: null
      }
    ];

    res.json(achievements);
  });
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { display_name, email, avatar_key } = req.body;
    
    // Validate avatar_key if provided
    const validAvatars = ['robot_coral', 'robot_gold', 'robot_lavender', 'robot_mint', 'robot_sky'];

    // Validate input
    if (!display_name || !email) {
      return res.status(400).json({ error: 'Display name and email are required' });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.errors[0] || 'Invalid email address' });
    }

    // Validate display name
    const displayNameValidation = validateDisplayName(display_name);
    if (!displayNameValidation.isValid) {
      return res.status(400).json({ error: displayNameValidation.errors[0] || 'Invalid display name' });
    }

    // Get current user data
    db.get('SELECT email, display_name, avatar_key FROM users WHERE id = ?', [userId], async (err, currentUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate and set avatar_key - use provided one if valid, otherwise keep existing
      const finalAvatarKey = (avatar_key && validAvatars.includes(avatar_key)) 
        ? avatar_key 
        : (currentUser.avatar_key || 'robot_coral');

      const emailChanged = email !== currentUser.email;

      // If email changed, require verification (R3.3)
      if (emailChanged) {
        // Check if new email is already taken
        const emailCheckQuery = `SELECT id FROM users WHERE email = ? AND id != ?`;
        
        db.get(emailCheckQuery, [email, userId], async (err, existingUser) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            return res.status(400).json({ error: 'Email is already taken' });
          }

          // Generate verification token for new email
          const verificationToken = generateToken();
          const verificationExpires = new Date();
          verificationExpires.setDate(verificationExpires.getDate() + 5); // 5 days

          // Store new email and verification token (don't update email yet)
          db.run(
            'UPDATE users SET display_name = ?, avatar_key = ?, new_email = ?, new_email_verification_token = ?, new_email_verification_expires = ? WHERE id = ?',
            [display_name, finalAvatarKey, email, verificationToken, verificationExpires.toISOString(), userId],
            async function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update profile' });
              }

              // Send verification email to new email address
              const emailResult = await sendEmailChangeVerificationEmail(email, verificationToken, display_name);
              
              // Send notification to old email address
              await sendEmailChangeNotification(currentUser.email, email, display_name);

              // Get updated user data
              const getUserQuery = `SELECT id, email, display_name, avatar_key, total_xp, level, new_email FROM users WHERE id = ?`;
              
              db.get(getUserQuery, [userId], (err, updatedUser) => {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({ error: 'Failed to retrieve updated user data' });
                }

                res.json({ 
                  message: 'Profile updated. Please verify your new email address. A verification email has been sent to the new address.',
                  requiresEmailVerification: true,
                  user: updatedUser
                });
              });
            }
          );
        });
      } else {
        // Email didn't change, just update display name and avatar
        const updateQuery = `
          UPDATE users 
          SET display_name = ?, avatar_key = ?
          WHERE id = ?
        `;

        db.run(updateQuery, [display_name, finalAvatarKey, userId], function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          // Get updated user data
          const getUserQuery = `SELECT id, email, display_name, avatar_key, total_xp, level FROM users WHERE id = ?`;
          
          db.get(getUserQuery, [userId], (err, updatedUser) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to retrieve updated user data' });
            }

            res.json({ 
              message: 'Profile updated successfully',
              user: updatedUser
            });
          });
        });
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Verify email change
router.get('/verify-email-change', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const db = getDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Find user with this verification token
    db.get(
      'SELECT id, email, new_email, new_email_verification_expires FROM users WHERE new_email_verification_token = ?',
      [token],
      (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        // Check if token has expired
        const now = new Date();
        const expires = new Date(user.new_email_verification_expires);
        
        if (now > expires) {
          return res.status(400).json({ error: 'Verification token has expired' });
        }

        // Check if new email is already taken by another user
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [user.new_email, user.id], (err, existingUser) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            // Clear the pending email change
            db.run('UPDATE users SET new_email = NULL, new_email_verification_token = NULL, new_email_verification_expires = NULL WHERE id = ?', [user.id]);
            return res.status(400).json({ error: 'This email address is already in use by another account' });
          }

          // Update email and clear verification fields
          db.run(
            'UPDATE users SET email = ?, email_verified = 1, new_email = NULL, new_email_verification_token = NULL, new_email_verification_expires = NULL WHERE id = ?',
            [user.new_email, user.id],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update email' });
              }

              res.json({
                message: 'Email address changed successfully',
                verified: true
              });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Email change verification error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password with strength requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.errors[0] || 'New password does not meet security requirements' });
    }

    // Get user's current password hash
    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Check if new password is the same as current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return res.status(400).json({ error: 'New password must be different from your current password' });
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update password' });
        }

        res.json({ message: 'Password updated successfully' });
      });
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;
