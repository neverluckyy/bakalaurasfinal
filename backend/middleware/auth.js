const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const authenticateToken = (req, res, next) => {
  // Try to get token from Authorization header first (for localStorage)
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  // Fall back to cookie if no header token
  const tokenFromCookie = req.cookies.token;
  
  // Use header token if available, otherwise use cookie
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const getUserProfile = async (req, res, next) => {
  try {
    const db = getDatabase();
    
    if (!db) {
      console.error('Database connection is null in getUserProfile');
      return res.status(500).json({ error: 'Database connection error' });
    }
    
    db.get(
      'SELECT id, email, display_name, avatar_key, total_xp, level, is_admin, email_verified, new_email, email_verification_expires FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          console.error('Database query error in getUserProfile:', err);
          return res.status(500).json({ error: 'Database error', message: err.message });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        req.userProfile = user;
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const requireAdmin = (req, res, next) => {
  const db = getDatabase();
  
  if (!db) {
    console.error('Database connection is null in requireAdmin');
    return res.status(500).json({ error: 'Database connection error' });
  }
  
  db.get(
    'SELECT is_admin FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Database query error in requireAdmin:', err);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    }
  );
};

module.exports = { authenticateToken, getUserProfile, requireAdmin };
