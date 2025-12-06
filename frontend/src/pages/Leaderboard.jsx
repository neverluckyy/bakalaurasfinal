import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Medal, Award, Star, TrendingUp, Search, ArrowUpDown, User } from 'lucide-react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [userRankLoading, setUserRankLoading] = useState(false);
  
  // Filters and controls
  const [topLimit, setTopLimit] = useState(10); // Top 10, 50, 100, or 0 for all
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('xp'); // 'xp', 'level', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  const userEntryRef = useRef(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit: topLimit || 1000, // Large number for "All"
        offset: 0,
        sortBy,
        sortOrder
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await axios.get('/api/leaderboard', { params });
      
      if (response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard || []);
        setTotal(response.data.total || 0);
      } else {
        // Fallback for old API format
        setLeaderboard(Array.isArray(response.data) ? response.data : []);
        setTotal(response.data.length || 0);
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error fetching leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [topLimit, searchQuery, sortBy, sortOrder]);

  const fetchUserRank = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setUserRankLoading(true);
      const response = await axios.get('/api/leaderboard/my-rank');
      setUserRank(response.data);
    } catch (err) {
      console.error('Error fetching user rank:', err);
    } finally {
      setUserRankLoading(false);
    }
  }, [user?.id]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 300);

    return () => clearTimeout(timer);
  }, [topLimit, searchQuery, sortBy, sortOrder, fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [fetchLeaderboard, fetchUserRank]);

  const scrollToUser = async () => {
    // If user is already in the current list, just scroll to them
    if (userEntryRef.current) {
      userEntryRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add a highlight animation
      userEntryRef.current.classList.add('highlight-user');
      setTimeout(() => {
        userEntryRef.current?.classList.remove('highlight-user');
      }, 2000);
      return;
    }

    // User not in current view - fetch around their rank
    if (userRank?.rank) {
      const rank = userRank.rank;
      // Fetch 50 users centered around the user's rank
      const limit = 50;
      const offset = Math.max(0, rank - Math.floor(limit / 2));
      
      try {
        setLoading(true);
        const params = {
          limit,
          offset,
          sortBy: 'xp', // Always use XP sort to find user's actual rank
          sortOrder: 'desc'
        };

        const response = await axios.get('/api/leaderboard', { params });
        
        if (response.data.leaderboard) {
          setLeaderboard(response.data.leaderboard || []);
          setTotal(response.data.total || 0);
          setTopLimit(0); // Show all fetched results
          
          // Wait for DOM update, then scroll
          setTimeout(() => {
            if (userEntryRef.current) {
              userEntryRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              userEntryRef.current.classList.add('highlight-user');
              setTimeout(() => {
                userEntryRef.current?.classList.remove('highlight-user');
              }, 2000);
            }
          }, 300);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load your position');
      } finally {
        setLoading(false);
      }
    } else {
      // Fetch user rank first
      await fetchUserRank();
      // Retry after getting rank
      setTimeout(() => scrollToUser(), 500);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="rank-icon gold" />;
      case 2:
        return <Medal className="rank-icon silver" />;
      case 3:
        return <Award className="rank-icon bronze" />;
      default:
        return <Star className="rank-icon" />;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return 'rank-1';
      case 2:
        return 'rank-2';
      case 3:
        return 'rank-3';
      default:
        return '';
    }
  };



  const getCurrentUserRank = () => {
    if (!Array.isArray(leaderboard) || !user?.id) return null;
    const userIndex = leaderboard.findIndex(entry => entry.id === user.id);
    return userIndex !== -1 ? userIndex + 1 : null;
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  const currentUserRank = getCurrentUserRank();
  const displayRank = userRank?.rank || currentUserRank;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>
          {topLimit === 0 
            ? `All ${total} learners` 
            : `Top ${topLimit} of ${total} learners`}
        </p>
      </div>

      {/* Controls Section */}
      <div className="leaderboard-controls">
        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="top-limit">Show:</label>
            <select
              id="top-limit"
              className="control-select"
              value={topLimit}
              onChange={(e) => setTopLimit(parseInt(e.target.value))}
            >
              <option value={10}>Top 10</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
              <option value={0}>All Users</option>
            </select>
          </div>

          <div className="control-group search-group">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="control-input"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="control-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select
              id="sort-by"
              className="control-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="xp">XP</option>
              <option value="level">Level</option>
              <option value="name">Name</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              aria-label={`Sort ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>

          {user && (
            <button
              className="show-me-btn"
              onClick={scrollToUser}
              disabled={userRankLoading}
            >
              <User size={18} />
              {userRankLoading ? 'Loading...' : displayRank ? `My Rank (#${displayRank})` : 'Show Me'}
            </button>
          )}
        </div>
      </div>

      <div className="leaderboard-stats">
        <div className="stat-card">
          <TrendingUp size={24} />
          <div className="stat-content">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Learners</div>
          </div>
        </div>
        {displayRank && (
          <div className="stat-card">
            <Trophy size={24} />
            <div className="stat-content">
              <div className="stat-value">#{displayRank}</div>
              <div className="stat-label">Your Rank</div>
            </div>
          </div>
        )}
        {userRank && (
          <div className="stat-card">
            <Star size={24} />
            <div className="stat-content">
              <div className="stat-value">{userRank.xp?.toLocaleString() || 0}</div>
              <div className="stat-label">Your XP</div>
            </div>
          </div>
        )}
      </div>

      <div className="leaderboard-list">
        <div className="leaderboard-header-row">
          <div className="rank-header">Rank</div>
          <div className="user-header">User</div>
          <div className="xp-header">XP</div>
        </div>

        {Array.isArray(leaderboard) && leaderboard.map((entry, index) => {
          // Calculate rank - for XP descending, use position; for other sorts, show position
          const rank = index + 1;
          const isCurrentUser = entry.id === user?.id;
          
          // Find top XP for progress bar (only show if sorted by XP descending)
          const topXp = sortBy === 'xp' && sortOrder === 'desc' && leaderboard.length > 0
            ? leaderboard[0].xp
            : Math.max(...leaderboard.map(e => e.xp || 0));
          const showProgress = topXp > 0 && entry.xp < topXp;
          
          return (
            <div
              key={entry.id}
              ref={isCurrentUser ? userEntryRef : null}
              className={`leaderboard-entry ${getRankClass(rank)} ${
                isCurrentUser ? 'current-user' : ''
              }`}
            >
              <div className="rank-column">
                <div className="rank-number">
                  {getRankIcon(rank)}
                  <span>{rank}</span>
                </div>
              </div>

              <div className="user-column">
                <div className="user-info">
                  <img
                    src={`/avatars/${entry.avatar_key || 'robot_coral'}.svg`}
                    alt={entry.display_name}
                    className="user-avatar"
                    onError={(e) => {
                      console.error(`Failed to load avatar: ${entry.avatar_key}`);
                      e.target.src = '/avatars/robot_coral.svg';
                    }}
                  />
                  <div className="user-details">
                    <div className="user-name">
                      {entry.display_name}
                      {isCurrentUser && <span className="you-badge">You</span>}
                    </div>
                    <div className="user-email">{entry.email}</div>
                  </div>
                </div>
              </div>

              <div className="xp-column">
                <div className="xp-amount">{entry.xp?.toLocaleString() || 0}</div>
                <div className="xp-label">XP</div>
                {showProgress && (
                  <div className="xp-progress">
                    <div 
                      className="progress-bar"
                      role="progressbar" 
                      aria-valuenow={Math.round(Math.min((entry.xp / topXp) * 100, 100))} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                      aria-label={`${entry.display_name} XP progress: ${Math.round(Math.min((entry.xp / topXp) * 100, 100))}% of top performer`}
                    >
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${Math.min((entry.xp / topXp) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(!Array.isArray(leaderboard) || leaderboard.length === 0) && (
        <div className="empty-state">
          <Trophy size={48} />
          <h3>No rankings yet</h3>
          <p>Start learning to appear on the leaderboard!</p>
        </div>
      )}

      {!currentUserRank && user && (
        <div className="user-not-ranked">
          <div className="not-ranked-card">
            <h3>Your Progress</h3>
            <div className="user-progress">
                             <img
                 src={`/avatars/${user.avatar_key || 'robot_coral'}.svg`}
                 alt={user.display_name}
                 className="user-avatar"
               />
                            <div className="progress-details">
                <div className="user-name">{user.display_name}</div>
                <div className="user-xp">{user.total_xp || 0} XP</div>
              </div>
            </div>
            <p>Keep learning to climb the leaderboard!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
