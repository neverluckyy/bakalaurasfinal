import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

import { BookOpen, Shield, ShieldCheck, Lock, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';
import './ModuleDetail.css';

const ModuleDetail = () => {
  const { moduleId } = useParams();
  const location = useLocation();

  const [module, setModule] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionProgress, setSectionProgress] = useState({}); // Map of sectionId -> hasProgress

  const fetchModuleData = useCallback(async () => {
    try {
      const [moduleRes, sectionsRes] = await Promise.all([
        axios.get(`/api/modules/${moduleId}`),
        axios.get(`/api/modules/${moduleId}/sections`)
      ]);
      
      setModule(moduleRes.data);
      
      // Remove duplicates by section ID to ensure no duplicates appear
      const uniqueSections = sectionsRes.data.filter((section, index, self) => 
        index === self.findIndex(s => s.id === section.id)
      );
      
      setSections(uniqueSections);
      
      // Check for saved progress for each section
      // Use section data from API which already includes learning_completed and other flags
      const progressMap = {};
      for (const section of uniqueSections) {
        let hasProgress = false;
        
        // Check if learning is completed (from API)
        if (section.learning_completed) {
          hasProgress = true;
        }
        
        // Check localStorage for reading position (faster check)
        if (!hasProgress) {
          try {
            const positionKey = `reading_position_${section.id}`;
            const positionData = localStorage.getItem(positionKey);
            if (positionData) {
              const parsed = JSON.parse(positionData);
              // Consider it started if stepIndex > 0 (they've progressed past the first step)
              if (parsed.stepIndex !== undefined && parsed.stepIndex > 0) {
                hasProgress = true;
              }
            }
          } catch (storageErr) {
            // Ignore localStorage errors
          }
        }
        
        // Check API for reading position if not found in localStorage
        if (!hasProgress) {
          try {
            const positionResponse = await axios.get(`/api/learning-content/section/${section.id}/position`);
            if (positionResponse.data && positionResponse.data.stepIndex !== undefined && positionResponse.data.stepIndex > 0) {
              hasProgress = true;
            }
          } catch (apiErr) {
            // Ignore errors - section might not have a saved position yet
          }
        }
        
        // Check quiz draft state
        if (!hasProgress) {
          try {
            const quizKey = `quiz_draft_${section.id}`;
            const quizData = localStorage.getItem(quizKey);
            if (quizData) {
              const parsed = JSON.parse(quizData);
              if (parsed.draftAnswers && Object.keys(parsed.draftAnswers).length > 0) {
                hasProgress = true;
              }
            }
          } catch (storageErr) {
            // Ignore errors
          }
        }
        
        // Check if quiz has been attempted (from API)
        if (!hasProgress && section.quiz_attempted) {
          hasProgress = true;
        }
        
        progressMap[section.id] = hasProgress;
      }
      
      setSectionProgress(progressMap);
    } catch (err) {
      setError('Failed to load module data');
      console.error('Error fetching module:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModuleData();
  }, [moduleId, fetchModuleData]);

  // Refresh data when returning from quiz completion
  useEffect(() => {
    if (location.state?.refresh && !loading) {
      fetchModuleData();
      // Clear the refresh state
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.refresh, loading, fetchModuleData]);

  if (loading) {
    return (
      <div className="module-detail-container">
        <div className="loading">Loading module...</div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="module-detail-container">
        <div className="error">{error || 'Module not found'}</div>
      </div>
    );
  }

  const getSectionIcon = (section) => {
    if (section.completed) return <ShieldCheck className="section-icon completed" />;
    if (section.available) return <Shield className="section-icon available" />;
    return <Lock className="section-icon locked" />;
  };

  const getSectionStatus = (section) => {
    if (section.completed) return 'completed';
    if (section.available) return 'available';
    return 'locked';
  };

  // Calculate total questions across all sections
  const totalQuestions = sections.reduce((sum, section) => {
    return sum + (section.question_count || 0);
  }, 0);

  // Check if module has no questions
  const hasNoQuestions = totalQuestions === 0 && sections.length > 0;

  return (
    <div className="module-detail-container">
      <div className="module-header">
        <div className="module-info">
          <h1>{module.title}</h1>
          <p className="module-description">{module.description}</p>
          <div className="module-stats">
            <span className="stat">
              <BookOpen size={16} />
              {sections.length} sections
            </span>
            <span className="stat">
              <CheckCircle size={16} />
              {sections.filter(s => s.completed).length} completed
            </span>
          </div>
        </div>
        <div className="module-progress">
          <div className="progress-circle">
            <svg viewBox="0 0 36 36" className="progress-ring">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeDasharray={`${sections.length > 0 ? (sections.filter(s => s.completed).length / sections.length) * 100 : 0}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="progress-text">
              {sections.length > 0 ? Math.round((sections.filter(s => s.completed).length / sections.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Show empty state if module has no questions */}
      {hasNoQuestions && (
        <div className="empty-state no-questions-state">
          <Info size={48} className="empty-icon" />
          <h3>No Questions Available</h3>
          <p>There are currently no questions in this module.</p>
          <p className="empty-subtitle">You can still explore the learning content in the sections below, or return to browse other modules.</p>
          <div className="empty-state-actions">
            <Link to="/modules" className="btn btn-primary">
              Back to Modules
            </Link>
          </div>
        </div>
      )}

      <div className="sections-list">
        <h2>Learning Sections</h2>
        {!Array.isArray(sections) || sections.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} className="empty-icon" />
            <h3>No Sections Available</h3>
            <p>This module doesn't have any learning sections yet.</p>
            <p className="empty-subtitle">Sections may be coming soon. Please check back later.</p>
            <Link to="/modules" className="btn btn-primary">
              Back to Modules
            </Link>
          </div>
        ) : (
          sections
            .filter((section, index, self) => 
              index === self.findIndex(s => s.id === section.id)
            )
            .map((section, index) => (
            <div
              key={section.id}
              className={`section-card ${getSectionStatus(section)}`}
            >
              <div className="section-content">
                <div className="section-icon-container">
                  {getSectionIcon(section)}
                </div>
                
                <div className="section-info">
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
                
                <div className="section-meta">
                  <span className="section-number">Section {index + 1}</span>
                  {section.completed && (
                    <span className="completion-badge">Completed</span>
                  )}
                </div>
                
                <div className="section-actions">
                  {section.completed ? (
                    <div className="retake-quiz-container">
                      <Link
                        to={`/sections/${section.id}/quiz`}
                        className="btn btn-secondary retake-quiz-btn"
                        title="Retake this quiz without re-reading the learning material"
                      >
                        Retake Quiz
                      </Link>
                      <span className="retake-hint">No re-reading required</span>
                    </div>
                  ) : (section.learning_completed && section.quiz_attempted) ? (
                    <div className="retake-quiz-container">
                      <Link
                        to={`/sections/${section.id}/quiz`}
                        className="btn btn-secondary retake-quiz-btn"
                        title="Re-take this quiz - you've already read the learning material and attempted the quiz"
                      >
                        Retake Quiz
                      </Link>
                      <span className="retake-hint">Learning material completed</span>
                    </div>
                  ) : section.learning_completed && !section.completed ? (
                    <div className="action-buttons">
                      <Link
                        to={`/sections/${section.id}/quiz`}
                        className="btn btn-primary"
                        title="Take the quiz to test your knowledge"
                      >
                        Take a Quiz
                      </Link>
                      <Link
                        to={`/sections/${section.id}/learn`}
                        className="btn btn-secondary"
                        title="Review the learning material"
                      >
                        Review Learning
                      </Link>
                    </div>
                  ) : section.available ? (
                    <div className="action-buttons">
                      <Link
                        to={`/sections/${section.id}/learn`}
                        className="btn btn-primary"
                      >
                        {sectionProgress[section.id] ? 'Continue Learning' : 'Start Learning'}
                      </Link>
                    </div>
                  ) : (
                    <div className="locked-message">
                      Complete previous sections to unlock
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;

