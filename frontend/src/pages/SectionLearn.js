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
        
      } catch (err) {
        setError('Failed to load section data');
        console.error('Error fetching section:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSectionData();
  }, [sectionId]);



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
        
        setCurrentStep(currentStep + 1);
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

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  // Handle case where section has no learning content yet
  if (!content || content.length === 0) {
    return (
      <div className="section-learn-container">
        <div className="learn-header">
          <Link to={`/modules/${section.module_id}`} className="back-button">
            <ArrowLeft size={20} />
            Back to Module
          </Link>
          <div className="section-info">
            <h1>{section.display_name || section.title}</h1>
            <p>{section.description || 'No description available'}</p>
          </div>
        </div>
        <div className="content-container">
          <div className="content-card">
            <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>This section doesn't have any learning content yet.</p>
              <p style={{ marginTop: '1rem', color: '#8A8A9A' }}>
                Please add learning content through the Admin Panel.
              </p>
            </div>
          </div>
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
        <Link to={`/modules/${section.module_id}`} className="back-button">
          <ArrowLeft size={20} />
          Back to Module
        </Link>
        <div className="section-info">
          <h1>{section.display_name || section.title}</h1>
          <p>{section.description || 'No description available'}</p>
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
              const markdown = currentContent.content_markdown || '';
              const elements = [];
              let keyIndex = 0;

              // Split content into lines, preserving structure
              const lines = markdown.split('\n');
              
              let currentParagraph = [];
              
              const flushParagraph = () => {
                if (currentParagraph.length > 0) {
                  const paragraphText = currentParagraph.join(' ').trim();
                  if (paragraphText) {
                    // Process bold text in paragraph
                    const parts = [];
                    let lastIndex = 0;
                    const boldRegex = /\*\*([^*]+)\*\*/g;
                    let match;
                    let matchKey = 0;
                    
                    while ((match = boldRegex.exec(paragraphText)) !== null) {
                      // Add text before the bold
                      if (match.index > lastIndex) {
                        parts.push(paragraphText.substring(lastIndex, match.index));
                      }
                      // Add the bold text
                      parts.push(<strong key={`bold-${keyIndex}-${matchKey++}`}>{match[1]}</strong>);
                      lastIndex = match.index + match[0].length;
                    }
                    
                    // Add remaining text after last bold
                    if (lastIndex < paragraphText.length) {
                      parts.push(paragraphText.substring(lastIndex));
                    }
                    
                    if (parts.length > 0) {
                      elements.push(<p key={`p-${keyIndex++}`}>{parts}</p>);
                    } else {
                      elements.push(<p key={`p-${keyIndex++}`}>{paragraphText}</p>);
                    }
                  }
                  currentParagraph = [];
                }
              };

              lines.forEach((line) => {
                const trimmedLine = line.trim();
                
                // Empty line - flush current paragraph
                if (trimmedLine === '') {
                  flushParagraph();
                  elements.push(<br key={`br-${keyIndex++}`} />);
                  return;
                }
                
                // Check for markdown image syntax: ![alt](src)
                const imageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                if (imageMatch) {
                  flushParagraph(); // Flush any pending paragraph before image
                  const [, alt, src] = imageMatch;
                  elements.push(
                    <div key={`img-${keyIndex++}`} className="phishing-image-container">
                      <img 
                        src={src} 
                        alt={alt || 'Phishing example'} 
                        className="phishing-example-image"
                        onError={(e) => {
                          console.error(`Failed to load image: ${src}`);
                          // Show placeholder instead of hiding
                          e.target.style.border = '2px dashed #6A5ACD';
                          e.target.alt = `Image not found: ${alt || src}`;
                        }}
                      />
                      {alt && <div className="image-caption">{alt}</div>}
                    </div>
                  );
                  return;
                }
                
                // Add line to current paragraph
                currentParagraph.push(trimmedLine);
              });
              
              // Flush any remaining paragraph
              flushParagraph();

              return elements.length > 0 ? elements : <p>No content available</p>;
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
