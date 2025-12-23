const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get leaderboard with pagination, search, filters, and sorting
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  // Parse query parameters
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'xp'; // 'xp', 'level', 'name'
  const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  
  // Build WHERE clause for search
  let whereClause = '';
  const params = [];
  
  if (search) {
    whereClause = 'WHERE display_name LIKE ? OR email LIKE ?';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  
  // Build ORDER BY clause
  let orderByClause = '';
  switch (sortBy) {
    case 'level':
      orderByClause = `ORDER BY level ${sortOrder}, total_xp ${sortOrder}`;
      break;
    case 'name':
      orderByClause = `ORDER BY display_name ${sortOrder}`;
      break;
    case 'xp':
    default:
      orderByClause = `ORDER BY total_xp ${sortOrder}, level ${sortOrder}`;
      break;
  }
  
  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users
    ${whereClause}
  `;
  
  // Get leaderboard data
  const query = `
    SELECT 
      id,
      display_name,
      email,
      avatar_key,
      total_xp as xp,
      level
    FROM users
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;
  
  // Execute count query
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      console.error('Database error (count):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const total = countResult?.total || 0;
    
    // Execute main query
    db.all(query, [...params, limit, offset], (err, leaderboard) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        leaderboard: leaderboard || [],
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      });
    });
  });
});

// Get user's rank
router.get('/my-rank', authenticateToken, (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;
  
  // Get user's XP and level
  const userQuery = `
    SELECT total_xp, level
    FROM users
    WHERE id = ?
  `;
  
  db.get(userQuery, [userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Count users with higher XP (or same XP but higher level, or same XP/level but earlier ID)
    const rankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE total_xp > ? 
         OR (total_xp = ? AND level > ?)
         OR (total_xp = ? AND level = ? AND id < ?)
    `;
    
    db.get(rankQuery, [user.total_xp, user.total_xp, user.level, user.total_xp, user.level, userId], (err, rankResult) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get total users count
      db.get('SELECT COUNT(*) as total FROM users', [], (err, totalResult) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
          rank: rankResult?.rank || null,
          total: totalResult?.total || 0,
          xp: user.total_xp,
          level: user.level
        });
      });
    });
  });
});

module.exports = router;
