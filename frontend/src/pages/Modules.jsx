import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Shield, ShieldAlert, MailWarning, Lock } from 'lucide-react';
import axios from 'axios';
import './Modules.css';

function Modules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/modules', { withCredentials: true });
      // Ensure we always set an array
      const modulesData = Array.isArray(response.data) ? response.data : [];
      setModules(modulesData);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getModuleButtonIcon = (moduleName) => {
    if (moduleName.includes('Security Awareness')) {
      return <Shield className="btn-icon" />;
    }
    if (moduleName.includes('Phishing')) {
      return <ShieldAlert className="btn-icon" />;
    }
    if (moduleName.includes('Business Email')) {
      return <MailWarning className="btn-icon" />;
    }
    return <Shield className="btn-icon" />;
  };

  if (loading) {
    return (
      <div className="modules-container">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modules-container">
      <div className="modules-header">
        <h1>Learning Modules</h1>
        <p>Master the fundamentals of social engineering defense</p>
      </div>

      <div className="modules-grid">
        {Array.isArray(modules) && modules.map((module, index) => {
          const isAvailable = module.available !== false; // Default to true if not specified (backward compatibility)
          const isLocked = !isAvailable;
          
          return (
            <div 
              key={module.id} 
              className={`module-card ${isLocked ? 'locked' : ''}`}
            >
              <div className="module-content">
                <h3>{module.display_name}</h3>
                <p className="module-description">
                  {module.description || 'Learn essential security concepts and best practices'}
                </p>
                
                <div className="module-stats">
                  <div className="stat">
                    <BookOpen className="stat-icon" />
                    <span>{module.section_count} sections</span>
                  </div>
                  <div className="stat">
                    <CheckCircle className="stat-icon" />
                    <span>{module.completed_sections} completed</span>
                  </div>
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
                </div>
                
                {isLocked ? (
                  <div className="module-locked">
                    <Lock className="lock-icon" />
                    <span className="locked-message">Complete previous module to unlock</span>
                  </div>
                ) : (
                  <Link 
                    to={`/modules/${module.id}`} 
                    className="btn btn-primary module-btn"
                  >
                    {getModuleButtonIcon(module.display_name)}
                    {module.completion_percentage === 100 
                      ? 'Review' 
                      : module.has_started 
                        ? 'Continue Learning' 
                        : 'Start Learning'}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(!Array.isArray(modules) || modules.length === 0) && (
        <div className="empty-state">
          <BookOpen className="empty-icon" />
          <h3>No modules available</h3>
          <p>Check back later for new learning content</p>
        </div>
      )}
    </div>
  );
}

export default Modules;
