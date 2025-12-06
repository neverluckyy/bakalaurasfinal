import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { ArrowLeft, BookOpen, CheckCircle, Play } from 'lucide-react';
import axios from 'axios';
import './SectionLearn.css';

const SectionLearn = () => {
  const { sectionId } = useParams();

  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [content, setContent] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const fetchSectionData = async () => {
      try {
        // Fetch section data
        const sectionResponse = await axios.get(`/api/sections/${sectionId}`);
        setSection(sectionResponse.data);
        
        // Fetch learning content from database
        const contentResponse = await axios.get(`/api/learning-content/section/${sectionId}`);
        setContent(contentResponse.data);
        
        // Fetch user progress
        const progressResponse = await axios.get(`/api/learning-content/section/${sectionId}/progress`);
        setProgress(progressResponse.data);
        
        // Fetch saved reading position (try API first, fallback to localStorage)
        let savedStep = 0;
        try {
          const positionResponse = await axios.get(`/api/learning-content/section/${sectionId}/position`);
          savedStep = positionResponse.data.stepIndex || 0;
        } catch (positionErr) {
          console.error('Error fetching reading position from server:', positionErr);
          // Fallback to localStorage
          try {
            const storageKey = `reading_position_${sectionId}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              const parsed = JSON.parse(savedData);
              savedStep = parsed.stepIndex || 0;
            }
          } catch (storageErr) {
            console.error('Error reading from localStorage:', storageErr);
          }
        }
        
        // Only restore if there's content and the saved step is valid
        if (contentResponse.data && contentResponse.data.length > 0 && savedStep < contentResponse.data.length && savedStep >= 0) {
          setCurrentStep(savedStep);
        }
        
      } catch (err) {
        setError('Failed to load section data');
        console.error('Error fetching section:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSectionData();
  }, [sectionId]);



  // Save reading position whenever currentStep changes
  useEffect(() => {
    if (content.length > 0 && currentStep >= 0) {
      const savePosition = async () => {
        // Save to localStorage immediately (synchronous, always works)
        const storageKey = `reading_position_${sectionId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          stepIndex: currentStep,
          timestamp: Date.now()
        }));
        
        // Also save to backend (async, may fail but localStorage is backup)
        try {
          await axios.post(`/api/learning-content/section/${sectionId}/position`, {
            stepIndex: currentStep
          });
        } catch (err) {
          console.error('Error saving reading position to server:', err);
          // Progress is still saved in localStorage, so it's not lost
        }
      };
      savePosition();
    }
  }, [currentStep, sectionId, content.length]);

  // Save position on page unload and visibility change as safety nets
  useEffect(() => {
    const saveToStorage = () => {
      if (content.length > 0 && currentStep >= 0) {
        const storageKey = `reading_position_${sectionId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          stepIndex: currentStep,
          timestamp: Date.now()
        }));
      }
    };

    const handleBeforeUnload = () => {
      saveToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveToStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStep, sectionId, content.length]);

  const handleNext = async () => {
    if (currentStep < content.length - 1) {
      // Mark current content as completed
      try {
        await axios.post(`/api/learning-content/${content[currentStep].id}/complete`);
        
        // Update progress locally
        if (progress) {
          const updatedProgress = { ...progress };
          updatedProgress.progress[currentStep].completed = true;
          updatedProgress.completedCount += 1;
          updatedProgress.completionPercentage = Math.round((updatedProgress.completedCount / updatedProgress.totalCount) * 100);
          setProgress(updatedProgress);
        }
        
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        
        // Save position after moving to next step
        try {
          await axios.post(`/api/learning-content/section/${sectionId}/position`, {
            stepIndex: nextStep
          });
        } catch (err) {
          console.error('Error saving reading position:', err);
        }
      } catch (err) {
        console.error('Error marking content as completed:', err);
        // Still move to next step even if marking fails
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Mark last content as completed and section as learned
      try {
        await axios.post(`/api/learning-content/${content[currentStep].id}/complete`);
        await axios.post(`/api/sections/${sectionId}/learn`);
        setIsCompleted(true);
      } catch (err) {
        console.error('Error marking section as learned:', err);
      }
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Save position after moving to previous step
      try {
        await axios.post(`/api/learning-content/section/${sectionId}/position`, {
          stepIndex: prevStep
        });
      } catch (err) {
        console.error('Error saving reading position:', err);
      }
    }
  };

  const handleComplete = async () => {
    // Mark section as learned if not already completed
    if (!isCompleted) {
      try {
        await axios.post(`/api/sections/${sectionId}/learn`);
        setIsCompleted(true);
      } catch (err) {
        console.error('Error marking section as learned:', err);
        return; // Don't navigate if marking as learned fails
      }
    }
    
    // Navigate to quiz
    navigate(`/sections/${sectionId}/quiz`);
  };

  if (loading) {
    return (
      <div className="section-learn-container">
        <div className="loading">Loading learning content...</div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="section-learn-container">
        <div className="error">{error || 'Section not found'}</div>
      </div>
    );
  }

  // Check if content is available
  if (!Array.isArray(content) || content.length === 0) {
    return (
      <div className="section-learn-container">
        <div className="learn-header">
          <Link to={`/module/${section.module_id}`} className="back-button">
            <ArrowLeft size={20} />
            Back to Module
          </Link>
          <div className="section-info">
            <h1>{section.title}</h1>
            <p>{section.description}</p>
          </div>
        </div>
        <div className="empty-state">
          <BookOpen size={48} className="empty-icon" />
          <h2>No Content Available</h2>
          <p>This section doesn't have any learning content yet.</p>
          <p className="empty-subtitle">Content may be coming soon. Please check back later.</p>
          <Link to={`/modules/${section.module_id}`} className="btn btn-primary">
            Back to Module
          </Link>
        </div>
      </div>
    );
  }

  const currentContent = content[currentStep];
  // Progress bar should always reflect current step position, not completion status
  const progressPercentage = ((currentStep + 1) / content.length) * 100;

  return (
    <div className="section-learn-container">
      <div className="learn-header">
        <Link to={`/module/${section.module_id}`} className="back-button">
          <ArrowLeft size={20} />
          Back to Module
        </Link>
        <div className="section-info">
          <h1>{section.title}</h1>
          <p>{section.description}</p>
        </div>
      </div>

      <div 
        className="progress-bar"
        role="progressbar" 
        aria-valuenow={Math.round(progressPercentage)} 
        aria-valuemin="0" 
        aria-valuemax="100"
        aria-label={`Learning progress: Step ${currentStep + 1} of ${content.length}`}
      >
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        <span className="progress-text">
          Step {currentStep + 1} of {content.length}
        </span>
      </div>

      <div className="content-container">
        <div className="content-card">
          <div className="content-header">
            <div className="content-icon">
              <BookOpen size={24} />
            </div>
            <div className="content-meta">
              <h2>{currentContent.screen_title}</h2>
              <span className="duration">~{currentContent.read_time_min} min read</span>
            </div>
          </div>

          <div className="content-body">
            {(() => {
              const lines = currentContent.content_markdown.split('\n');
              const elements = [];

              lines.forEach((line, index) => {
                // Remove bullet point characters from the beginning of lines
                const cleanLine = line.replace(/^[•\-\*]\s*/, '');
                
                // Check for markdown image syntax: ![alt text](image-path)
                const imageMatch = cleanLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                if (imageMatch) {
                  const altText = imageMatch[1];
                  const imagePath = imageMatch[2];
                  elements.push(
                    <div key={index} className="phishing-image-container">
                      <img 
                        src={imagePath} 
                        alt={altText || 'Phishing example'} 
                        className="phishing-example-image"
                        onError={(e) => {
                          console.error('Failed to load image:', imagePath);
                          e.target.style.display = 'none';
                        }}
                      />
                      {altText && (
                        <div className="image-caption">{altText}</div>
                      )}
                    </div>
                  );
                } else if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
                  elements.push(
                    <strong key={index}>
                      {cleanLine.slice(2, -2)}
                    </strong>
                  );
                } else if (cleanLine.trim() === '') {
                  elements.push(<br key={index} />);
                } else {
                  elements.push(<p key={index}>{cleanLine}</p>);
                }
              });

              return elements;
            })()}
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="btn btn-secondary"
          >
            Previous
          </button>

          {currentStep < content.length - 1 ? (
            <button onClick={handleNext} className="btn btn-primary">
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="btn btn-primary"
            >
              {isCompleted ? 'Take Quiz' : 'Complete Learning'}
            </button>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="completion-banner">
          <CheckCircle size={24} />
          <span>Learning completed! You can now take the quiz to test your knowledge.</span>
        </div>
      )}
    </div>
  );
};

export default SectionLearn;
