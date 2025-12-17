const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { validatePassword, validateEmail, validateDisplayName } = require('../utils/passwordValidation');
const { generateToken, sendEmailChangeVerificationEmail, sendEmailChangeNotification } = require('../utils/emailService');

const router = express.Router();

// Get user statistics
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;
  
  // Get basic stats
  const statsQuery = `
    SELECT 
      COUNT(DISTINCT up.question_id) as questions_answered,
      SUM(CASE WHEN up.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
      SUM(up.xp_awarded) as total_xp_earned
    FROM user_progress up
    WHERE up.user_id = ?
  `;

  // Get completed modules count
  // A module is completed if all its sections are completed
  const modulesCompletedQuery = `
    SELECT COUNT(DISTINCT m.id) as modules_completed
    FROM modules m
    WHERE NOT EXISTS (
      SELECT 1
      FROM sections s
      WHERE s.module_id = m.id
      AND NOT (
        -- Section is completed if:
        -- 1. It has questions AND user passed (>80%)
        (
          (SELECT COUNT(DISTINCT q.id) FROM questions q WHERE q.section_id = s.id) > 0
          AND
          (
            SELECT COUNT(DISTINCT q2.id)
            FROM questions q2
            LEFT JOIN user_progress up ON q2.id = up.question_id AND up.user_id = ?
            WHERE q2.section_id = s.id AND up.is_correct = 1
          ) * 1.0 / (
            SELECT COUNT(DISTINCT q3.id)
            FROM questions q3
            WHERE q3.section_id = s.id
          ) >= 0.8
        )
        OR
        -- 2. It has NO questions AND user read all content
        (
          (SELECT COUNT(DISTINCT q.id) FROM questions q WHERE q.section_id = s.id) = 0
          AND
          (
            SELECT COUNT(DISTINCT lc.id)
            FROM learning_content lc
            WHERE lc.section_id = s.id
          ) > 0
          AND
          (
            SELECT COUNT(DISTINCT lc.id)
            FROM learning_content lc
            JOIN user_learning_progress ulp ON lc.id = ulp.learning_content_id AND ulp.user_id = ?
            WHERE lc.section_id = s.id AND ulp.completed = 1
          ) = (
            SELECT COUNT(DISTINCT lc.id)
            FROM learning_content lc
            WHERE lc.section_id = s.id
          )
        )
      )
    )
  `;

  // Get completed sections count
  const sectionsCompletedQuery = `
    SELECT COUNT(DISTINCT s.id) as sections_completed
    FROM sections s
    WHERE (
      -- 1. It has questions AND user passed (>80%)
      (
        (SELECT COUNT(DISTINCT q.id) FROM questions q WHERE q.section_id = s.id) > 0
        AND
        (
          SELECT COUNT(DISTINCT q2.id)
          FROM questions q2
          LEFT JOIN user_progress up ON q2.id = up.question_id AND up.user_id = ?
          WHERE q2.section_id = s.id AND up.is_correct = 1
        ) * 1.0 / (
          SELECT COUNT(DISTINCT q3.id)
          FROM questions q3
          WHERE q3.section_id = s.id
        ) >= 0.8
      )
      OR
      -- 2. It has NO questions AND user read all content
      (
        (SELECT COUNT(DISTINCT q.id) FROM questions q WHERE q.section_id = s.id) = 0
        AND
        (
          SELECT COUNT(DISTINCT lc.id)
          FROM learning_content lc
          WHERE lc.section_id = s.id
        ) > 0
        AND
        (
          SELECT COUNT(DISTINCT lc.id)
          FROM learning_content lc
          JOIN user_learning_progress ulp ON lc.id = ulp.learning_content_id AND ulp.user_id = ?
          WHERE lc.section_id = s.id AND ulp.completed = 1
        ) = (
          SELECT COUNT(DISTINCT lc.id)
          FROM learning_content lc
          WHERE lc.section_id = s.id
        )
      )
    )
  `;

  // Get quizzes passed count (sections where user got 80% or more questions correct)
  const quizzesPassedQuery = `
    SELECT COUNT(DISTINCT s.id) as quizzes_passed
    FROM sections s
    WHERE (
      SELECT COUNT(DISTINCT q.id)
      FROM questions q
      WHERE q.section_id = s.id
    ) > 0
    AND (
      SELECT COUNT(DISTINCT q2.id)
      FROM questions q2
      LEFT JOIN user_progress up ON q2.id = up.question_id AND up.user_id = ?
      WHERE q2.section_id = s.id AND up.is_correct = 1
    ) >= (
      SELECT COUNT(DISTINCT q.id) * 0.8
      FROM questions q
      WHERE q.section_id = s.id
    )
  `;

  // Get days active (count of unique days user answered questions)
  const daysActiveQuery = `
    SELECT COUNT(DISTINCT DATE(up.answered_at)) as days_active
    FROM user_progress up
    WHERE up.user_id = ?
  `;

  db.get(statsQuery, [userId], (err, stats) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get completed modules count
    // Need to pass userId twice for the two subqueries (Case 1 and Case 2)
    db.get(modulesCompletedQuery, [userId, userId], (err, modulesResult) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get completed sections count
      // Need to pass userId twice for the two subqueries
      db.get(sectionsCompletedQuery, [userId, userId], (err, sectionsResult) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Get quizzes passed count
        db.get(quizzesPassedQuery, [userId], (err, quizzesResult) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Get days active count
          db.get(daysActiveQuery, [userId], (err, daysResult) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            const modulesCompleted = modulesResult?.modules_completed || 0;
            const sectionsCompleted = sectionsResult?.sections_completed || 0;
            const quizzesPassed = quizzesResult?.quizzes_passed || 0;
            const daysActive = daysResult?.days_active || 0;

            res.json({
              modulesCompleted,
              sectionsCompleted,
              quizzesPassed,
              daysActive,
              totalQuestionsAnswered: stats?.questions_answered || 0,
              totalCorrectAnswers: stats?.correct_answers || 0,
              totalXPEarned: stats?.total_xp_earned || 0
            });
          });
        });
      });
    });
  });
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
