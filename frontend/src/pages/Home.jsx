import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  Trophy, 
  Star,
  X,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import './Home.css';

function Home() {
  const { user, checkAuth } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [hasStartedLearning, setHasStartedLearning] = useState(false);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    fetchModules();
    // Only refresh user data if we need to check email verification status
    // Don't call on every render to avoid rate limiting
    if (user && !user.email_verified) {
      checkAuth();
    }
  }, [user, checkAuth]); // Include dependencies to satisfy ESLint

  useEffect(() => {
    // Check if email is not verified and calculate days remaining
    if (user && !user.email_verified && user.email_verification_expires) {
      setShowEmailNotification(true);
      
      // Calculate days remaining
      const calculateDaysRemaining = () => {
        if (!user?.email_verification_expires) {
          setDaysRemaining(null);
          return;
        }

        const now = new Date();
        const expires = new Date(user.email_verification_expires);
        const diffTime = expires - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          setDaysRemaining(0);
        } else {
          setDaysRemaining(diffDays);
        }
      };
      
      calculateDaysRemaining();
      
      // Update countdown every hour
      const interval = setInterval(() => {
        calculateDaysRemaining();
      }, 60 * 60 * 1000); // Update every hour
      
      return () => clearInterval(interval);
    } else {
      setShowEmailNotification(false);
      setDaysRemaining(null);
    }
  }, [user]);

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/modules', { withCredentials: true });
      // Ensure we always set an array
      const modulesData = Array.isArray(response.data) ? response.data : [];
      setModules(modulesData);
      
      // Calculate overall progress
      const totalSections = modulesData.reduce((sum, module) => sum + (module.section_count || 0), 0);
      const completedSections = modulesData.reduce((sum, module) => sum + (module.completed_sections || 0), 0);
      const progress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
      setOverallProgress(progress);
      
      // Check if user has started any learning (has any progress)
      // User has started if any module has has_started flag set to true
      // This flag is set by the backend when user has:
      // - Completed sections, OR
      // - Reading positions > 0, OR
      // - Quiz drafts, OR
      // - Learning progress entries, OR
      // - Completed learning content
      let hasProgress = modulesData.some(module => module.has_started === true);
      
      // Fallback: Also check for completed sections or completion percentage
      if (!hasProgress) {
        hasProgress = completedSections > 0 || 
                     modulesData.some(module => (module.completion_percentage || 0) > 0);
      }
      
      // Also check localStorage for in-progress learning (reading positions or quiz drafts)
      if (!hasProgress) {
        try {
          // Check all localStorage keys for reading positions or quiz drafts
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('reading_position_') || key.startsWith('quiz_draft_'))) {
              try {
                const data = JSON.parse(localStorage.getItem(key));
                // Check if it's actual progress (not just step 0 or empty)
                if (key.startsWith('reading_position_')) {
                  if (data.stepIndex > 0) {
                    hasProgress = true;
                    break;
                  }
                } else if (key.startsWith('quiz_draft_')) {
                  if (data.draftAnswers && Object.keys(data.draftAnswers).length > 0) {
                    hasProgress = true;
                    break;
                  }
                }
              } catch (parseErr) {
                // Ignore parse errors
              }
            }
          }
        } catch (storageErr) {
          // Ignore localStorage errors
        }
      }
      
      setHasStartedLearning(hasProgress);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]); // Set empty array on error
      
      // Even on error, check localStorage for progress
      let hasProgress = false;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('reading_position_') || key.startsWith('quiz_draft_'))) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (key.startsWith('reading_position_') && data.stepIndex > 0) {
                hasProgress = true;
                break;
              } else if (key.startsWith('quiz_draft_') && data.draftAnswers && Object.keys(data.draftAnswers).length > 0) {
                hasProgress = true;
                break;
              }
            } catch (parseErr) {
              // Ignore parse errors
            }
          }
        }
      } catch (storageErr) {
        // Ignore localStorage errors
      }
      setHasStartedLearning(hasProgress);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResending(true);
    setResendSuccess(false);
    
    try {
      await axios.post('/api/auth/resend-verification', { email: user.email });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
      // Refresh user data to get new expiration date
      checkAuth();
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setResending(false);
    }
  };

  const handleDismissNotification = () => {
    setShowEmailNotification(false);
  };



  if (loading) {
    return (
      <div className="home-container">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Email Verification Notification */}
      {showEmailNotification && user && !user.email_verified && (
        <div className="email-verification-notification">
          <div className="notification-content">
            <AlertCircle className="notification-icon" size={20} />
            <div className="notification-text">
              <strong>Please verify your email address</strong>
              <p>We've sent a verification email to <strong>{user.email}</strong>. Please check your inbox and verify your email.</p>
              {daysRemaining !== null && (
                <p className="countdown-text">
                  {daysRemaining === 0 ? (
                    <span className="expired">⚠️ Verification link has expired. Please request a new one.</span>
                  ) : daysRemaining === 1 ? (
                    <span className="warning">⏰ <strong>1 day remaining</strong> to verify your email.</span>
                  ) : (
                    <span>⏰ <strong>{daysRemaining} days remaining</strong> to verify your email.</span>
                  )}
                </p>
              )}
              {resendSuccess && (
                <p className="resend-success">Verification email sent! Please check your inbox.</p>
              )}
            </div>
          </div>
          <div className="notification-actions">
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="btn btn-secondary btn-sm"
            >
              {resending ? 'Sending...' : 'Resend Email'}
            </button>
            <button
              onClick={handleDismissNotification}
              className="notification-dismiss"
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="user-info">
            <div className="avatar-container">
              <img
                src={`/avatars/${user.avatar_key || 'robot_coral'}.svg`}
                alt="User Avatar"
                className="user-avatar"
                onError={(e) => {
                  console.error(`Failed to load avatar: ${user.avatar_key}`);
                  e.target.src = '/avatars/robot_coral.svg';
                }}
              />
            </div>
            <div className="user-details">
              <h1>Welcome back, {user.display_name}!</h1>
              <p className="user-level">Level {user.level || 1} • {user.total_xp || 0} XP</p>
            </div>
          </div>
          
          <div className="progress-section">
            <div 
              className="progress-bar" 
              role="progressbar" 
              aria-valuenow={overallProgress} 
              aria-valuemin="0" 
              aria-valuemax="100"
              aria-label={`Overall learning progress: ${overallProgress}% complete`}
            >
              <div 
                className="progress-fill" 
                style={{ width: `${overallProgress}%` }}
              ></div>
              <span className="progress-text">{overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/modules" className="action-card">
            <BookOpen className="action-icon" />
            <h3>{hasStartedLearning ? 'Continue Learning' : 'Start Learning'}</h3>
            <p>{hasStartedLearning ? 'Pick up where you left off' : 'Begin your learning journey'}</p>
          </Link>
          
          <Link to="/leaderboard" className="action-card">
            <Trophy className="action-icon" />
            <h3>View Leaderboard</h3>
            <p>See how you rank</p>
          </Link>
          
          <Link to="/profile" className="action-card">
            <Star className="action-icon" />
            <h3>Update Profile</h3>
            <p>Customize your avatar</p>
          </Link>
        </div>
      </div>

      {/* Recent Progress */}
      <div className="recent-progress">
        <h2>Your Progress</h2>
        <div className="modules-grid">
          {Array.isArray(modules) && modules.slice(0, 3).map((module) => (
            <div key={module.id} className="module-card">
              <div className="module-header">
                <h3>{module.display_name}</h3>
                <span className="completion-badge">
                  {module.completion_percentage}%
                </span>
              </div>
              <div className="module-progress">
                <div 
                  className="progress-bar"
                  role="progressbar" 
                  aria-valuenow={module.completion_percentage} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                  aria-label={`${module.display_name} progress: ${module.completion_percentage}% complete`}
                >
                  <div 
                    className="progress-fill" 
                    style={{ width: `${module.completion_percentage}%` }}
                  ></div>
                  <span className="progress-text">{module.completion_percentage}%</span>
                </div>
                <p>{module.completed_sections} of {module.section_count} sections completed</p>
              </div>
              <Link to={`/modules/${module.id}`} className="btn btn-secondary">
                {module.has_started ? 'Continue Learning' : 'Start Learning'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
