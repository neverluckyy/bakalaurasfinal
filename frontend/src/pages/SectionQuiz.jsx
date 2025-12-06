import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Star, Info } from 'lucide-react';
import axios from 'axios';
import './SectionQuiz.css';

const SectionQuiz = () => {
  const { sectionId } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [moduleId, setModuleId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const [questionOrder, setQuestionOrder] = useState([]); // Store randomized question order
  const [answerOrderMap, setAnswerOrderMap] = useState({}); // Store randomized answer order for each question
  const PASSING_THRESHOLD = 70; // Passing threshold percentage

  // Helper function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Randomize questions and answers
  const randomizeQuiz = (questionsData) => {
    // Randomize question order
    const questionIndices = questionsData.map((_, index) => index);
    const randomizedIndices = shuffleArray(questionIndices);
    setQuestionOrder(randomizedIndices);

    // Randomize answer order for each question
    const answerOrder = {};
    randomizedIndices.forEach((originalIndex) => {
      const question = questionsData[originalIndex];
      if (question.options && Array.isArray(question.options)) {
        const optionIndices = question.options.map((_, idx) => idx);
        const randomizedOptionIndices = shuffleArray(optionIndices);
        answerOrder[originalIndex] = randomizedOptionIndices;
      }
    });
    setAnswerOrderMap(answerOrder);

    // Return questions with randomized order and randomized options
    return randomizedIndices.map((originalIndex) => {
      const question = questionsData[originalIndex];
      if (answerOrder[originalIndex] && question.options) {
        const randomizedOptions = answerOrder[originalIndex].map(
          (optIdx) => question.options[optIdx]
        );
        // Update correct_answer to match new position
        const correctAnswerText = question.correct_answer;
        const newCorrectIndex = randomizedOptions.findIndex(
          (opt) => opt === correctAnswerText
        );
        return {
          ...question,
          options: randomizedOptions,
          originalIndex: originalIndex,
          correctAnswerIndex: newCorrectIndex
        };
      }
      return { ...question, originalIndex: originalIndex };
    });
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const [questionsResponse, sectionResponse] = await Promise.all([
          axios.get(`/api/sections/${sectionId}/questions`),
          axios.get(`/api/sections/${sectionId}`)
        ]);
        
        // Randomize questions and answers
        const randomizedQuestions = randomizeQuiz(questionsResponse.data);
        setQuestions(randomizedQuestions);
        setModuleId(sectionResponse.data.module_id);
        
        // Try to fetch draft state from API, fallback to localStorage
        let savedDraft = null;
        try {
          const draftResponse = await axios.get(`/api/sections/${sectionId}/quiz/draft`);
          savedDraft = draftResponse.data;
        } catch (err) {
          console.error('Error fetching draft from server:', err);
          // Fallback to localStorage
          try {
            const storageKey = `quiz_draft_${sectionId}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              const parsed = JSON.parse(savedData);
              savedDraft = {
                currentQuestionIndex: parsed.currentQuestionIndex || 0,
                draftAnswers: parsed.draftAnswers || {}
              };
            }
          } catch (storageErr) {
            console.error('Error reading from localStorage:', storageErr);
          }
        }
        
        // Restore saved draft state if available
        // Check if we can restore (only if question order matches or is compatible)
        if (savedDraft && savedDraft.draftAnswers && Object.keys(savedDraft.draftAnswers).length > 0) {
          // Map saved answers from original indices to randomized indices
          const mappedAnswers = {};
          randomizedQuestions.forEach((q, randomizedIndex) => {
            const originalIndex = q.originalIndex;
            if (savedDraft.draftAnswers[originalIndex] !== undefined) {
              mappedAnswers[randomizedIndex] = savedDraft.draftAnswers[originalIndex];
            }
          });
          setAnswers(mappedAnswers);
          
          // Recalculate score from saved answers using randomized questions
          let restoredScore = 0;
          randomizedQuestions.forEach((q, randomizedIndex) => {
            if (mappedAnswers[randomizedIndex] && mappedAnswers[randomizedIndex] === q.correct_answer) {
              restoredScore += 1;
            }
          });
          setScore(restoredScore);
          
          // Restore current question index if valid (map to randomized order)
          const savedOriginalIndex = savedDraft.currentQuestionIndex;
          if (savedOriginalIndex >= 0 && savedOriginalIndex < questionsResponse.data.length) {
            // Find the randomized index for this original index
            const randomizedIndex = randomizedQuestions.findIndex(
              (q) => q.originalIndex === savedOriginalIndex
            );
            if (randomizedIndex >= 0 && randomizedIndex < randomizedQuestions.length) {
              setCurrentQuestion(randomizedIndex);
              // Restore selected answer for current question if exists
              if (mappedAnswers[randomizedIndex] !== undefined) {
                setSelectedAnswer(mappedAnswers[randomizedIndex]);
              }
            }
          }
        }
      } catch (err) {
        setError('Failed to load quiz questions');
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [sectionId]);

  // Save draft state function
  const saveDraftState = async (questionIndex, draftAnswers, showFeedback = false) => {
    const draftToSave = draftAnswers || answers;
    
    // Save answers by original question index for consistency
    const answersByOriginalIndex = {};
    Object.keys(draftToSave).forEach((randomizedIndex) => {
      const q = questions[parseInt(randomizedIndex)];
      if (q && q.originalIndex !== undefined) {
        answersByOriginalIndex[q.originalIndex] = draftToSave[randomizedIndex];
      }
    });
    
    // Get current question's original index
    const currentQ = questions[questionIndex];
    const currentOriginalIndex = currentQ ? currentQ.originalIndex : questionIndex;
    
    // Save to localStorage immediately (synchronous, always works)
    const storageKey = `quiz_draft_${sectionId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      currentQuestionIndex: currentOriginalIndex,
      draftAnswers: answersByOriginalIndex,
      questionOrder: questionOrder, // Save the question order mapping
      timestamp: Date.now()
    }));
    
      // Also save to backend (async, may fail but localStorage is backup)
    try {
      if (showFeedback) {
        setSaveStatus('saving');
      }
      await axios.post(`/api/sections/${sectionId}/quiz/draft`, {
        currentQuestionIndex: currentOriginalIndex,
        draftAnswers: answersByOriginalIndex,
        questionOrder: questionOrder
      });
      if (showFeedback) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (err) {
      console.error('Error saving quiz draft to server:', err);
      // Progress is still saved in localStorage, so it's not lost
      if (showFeedback) {
        setSaveStatus('saved'); // Show saved since localStorage worked
        setTimeout(() => setSaveStatus(null), 2000);
      }
    }
  };

  const handleAnswerSelect = (answer) => {
    if (!answerSubmitted) {
      setSelectedAnswer(answer);
      // Auto-save draft answer
      const newAnswers = { ...answers, [currentQuestion]: answer };
      setAnswers(newAnswers);
      saveDraftState(currentQuestion, newAnswers);
    }
  };

  const handleSaveDraft = () => {
    saveDraftState(currentQuestion, answers, true);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
    setAnswers(newAnswers);
    
    // Save draft state after submitting answer
    saveDraftState(currentQuestion, newAnswers);

    // Check if answer is correct
    const currentQ = questions[currentQuestion];
    const isAnswerCorrect = selectedAnswer === currentQ.correct_answer;
    
    if (isAnswerCorrect) {
      setScore(score + 1);
    }

    setAnswerSubmitted(true);
    setShowExplanation(true);
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      
      // Restore saved answer for next question if exists
      const savedAnswer = answers[nextQuestion];
      setSelectedAnswer(savedAnswer || null);
      
      setShowExplanation(false);
      setAnswerSubmitted(false);
      
      // Save draft state with new current question
      saveDraftState(nextQuestion, answers);
    } else {
      // Quiz completed
      const finalScore = score; // Score is already updated in handleSubmitAnswer
      const percentage = (finalScore / questions.length) * 100;
      const earnedXP = Math.round((percentage / 100) * 50); // Max 50 XP per quiz
      
      setXpEarned(earnedXP);
      setQuizCompleted(true);

      // Submit quiz results
      // Map answers from randomized indices to original question indices for backend
      const answersByOriginalIndex = {};
      Object.keys(answers).forEach((randomizedIndex) => {
        const q = questions[parseInt(randomizedIndex)];
        if (q && q.originalIndex !== undefined) {
          answersByOriginalIndex[q.originalIndex] = answers[randomizedIndex];
        }
      });
      
      try {
        const response = await axios.post(`/api/sections/${sectionId}/quiz`, {
          answers: answersByOriginalIndex,
          score: finalScore,
          totalQuestions: questions.length
        });

        // Clear draft state after successful submission (both localStorage and server)
        const storageKey = `quiz_draft_${sectionId}`;
        localStorage.removeItem(storageKey);
        
        try {
          await axios.delete(`/api/sections/${sectionId}/quiz/draft`);
        } catch (draftErr) {
          console.error('Error clearing draft state from server:', draftErr);
        }

        // Update user XP
        if (response.data.xpEarned) {
          // Fetch updated user stats to ensure we have the latest data
          try {
            const userStatsResponse = await axios.get('/api/user/stats');
            const updatedUser = { 
              ...user, 
              total_xp: response.data.newTotalXP || (user.total_xp || 0) + response.data.xpEarned,
              level: response.data.newLevel || user.level
            };
            updateUser(updatedUser);
          } catch (statsErr) {
            console.error('Error fetching updated user stats:', statsErr);
            // Fallback to just updating XP
            updateUser({ ...user, total_xp: (user.total_xp || 0) + response.data.xpEarned });
          }
        }
      } catch (err) {
        console.error('Error submitting quiz results:', err);
      }
    }
  };

  const handleRetry = async () => {
    // Re-randomize questions and answers for retry
    try {
      const questionsResponse = await axios.get(`/api/sections/${sectionId}/questions`);
      const randomizedQuestions = randomizeQuiz(questionsResponse.data);
      setQuestions(randomizedQuestions);
    } catch (err) {
      console.error('Error fetching questions for retry:', err);
    }
    
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setXpEarned(0);
    setShowExplanation(false);
    setAnswerSubmitted(false);
    
    // Clear draft state on retry (both localStorage and server)
    const storageKey = `quiz_draft_${sectionId}`;
    localStorage.removeItem(storageKey);
    
    try {
      await axios.delete(`/api/sections/${sectionId}/quiz/draft`);
    } catch (err) {
      console.error('Error clearing draft state from server:', err);
    }
  };

  // Save draft state on page unload and visibility change as safety nets
  useEffect(() => {
    const saveToStorage = () => {
      if (questions.length > 0 && !quizCompleted) {
        // Save answers by original question index for consistency
        const answersByOriginalIndex = {};
        Object.keys(answers).forEach((randomizedIndex) => {
          const q = questions[parseInt(randomizedIndex)];
          if (q && q.originalIndex !== undefined) {
            answersByOriginalIndex[q.originalIndex] = answers[randomizedIndex];
          }
        });
        
        // Get current question's original index
        const currentQ = questions[currentQuestion];
        const currentOriginalIndex = currentQ ? currentQ.originalIndex : currentQuestion;
        
        const storageKey = `quiz_draft_${sectionId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          currentQuestionIndex: currentOriginalIndex,
          draftAnswers: answersByOriginalIndex,
          questionOrder: questionOrder,
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
  }, [currentQuestion, answers, sectionId, questions.length, quizCompleted]);

  if (loading) {
    return (
      <div className="section-quiz-container">
        <div className="loading">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-quiz-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="section-quiz-container">
        <div className="quiz-header">
          <Link to={`/sections/${sectionId}/learn`} className="back-button">
            <ArrowLeft size={20} />
            Back to Learning
          </Link>
        </div>
        <div className="empty-state">
          <Info size={48} className="empty-icon" />
          <h2>No Quiz Available</h2>
          <p>This section doesn't have any quiz questions yet.</p>
          <p className="empty-subtitle">The quiz may be coming soon. Please check back later.</p>
          <div className="empty-state-actions">
            <Link to={`/sections/${sectionId}/learn`} className="btn btn-secondary">
              Back to Learning
            </Link>
            {moduleId && (
              <Link to={`/modules/${moduleId}`} className="btn btn-primary">
                Back to Module
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassed = percentage >= PASSING_THRESHOLD;

    return (
      <div className="section-quiz-container">
        <div className="quiz-results">
          <div className="results-header">
            <h1>Quiz Complete!</h1>
            <div className={`score-badge ${isPassed ? 'passed' : 'failed'}`}>
              {isPassed ? <CheckCircle size={24} /> : <XCircle size={24} />}
              {percentage}%
            </div>
          </div>

          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-value">{score}</div>
              <div className="stat-label">Correct Answers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{questions.length}</div>
              <div className="stat-label">Total Questions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{xpEarned}</div>
              <div className="stat-label">XP Earned</div>
            </div>
          </div>

          {isPassed && (
            <div className="success-message">
              <Trophy size={32} />
              <h2>Congratulations!</h2>
              <p>You've successfully completed this section and earned {xpEarned} XP!</p>
            </div>
          )}

          {!isPassed && (
            <div className="failure-message">
              <XCircle size={32} />
              <h2>Keep Learning!</h2>
              <p>You scored {percentage}%, but you need {PASSING_THRESHOLD}% to pass. Review the material and try again.</p>
            </div>
          )}

          <div className="quiz-rules-info">
            <Info size={20} />
            <div>
              <strong>Quiz Rules:</strong>
              <ul>
                <li><strong>Randomization:</strong> Questions and answer options are randomized for each quiz attempt.</li>
                <li><strong>Passing Threshold:</strong> You need to score at least {PASSING_THRESHOLD}% to pass this quiz.</li>
                <li><strong>Retake Policy:</strong> You can retake this quiz at any time. Each retake will randomize questions and answers again.</li>
              </ul>
            </div>
          </div>

          <div className="next-steps">
            <h3>Next Steps:</h3>
            {isPassed ? (
              <div className="next-steps-content">
                <p>✓ Congratulations! You've passed this quiz.</p>
                <p>You can now proceed to the next section or review other modules.</p>
              </div>
            ) : (
              <div className="next-steps-content">
                <p>• Review the learning material to improve your understanding.</p>
                <p>• Retake the quiz when you're ready - questions will be randomized again.</p>
                <p>• Focus on the topics where you answered incorrectly.</p>
              </div>
            )}
          </div>

          <div className="results-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              Retake Quiz
            </button>
            <Link 
              to={`/sections/${sectionId}/learn`}
              className="btn btn-secondary"
            >
              Review Material
            </Link>
            <button 
              onClick={() => navigate(`/modules/${moduleId || 1}`, { state: { refresh: true } })}
              className="btn btn-secondary"
            >
              Back to Module
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isAnswerCorrect = selectedAnswer === currentQ.correct_answer;

  return (
    <div className="section-quiz-container">
      <div className="quiz-header">
        <Link to={`/sections/${sectionId}/learn`} className="back-button">
          <ArrowLeft size={20} />
          Back to Learning
        </Link>
        <div className="quiz-rules-banner">
          <Info size={16} />
          <span><strong>Quiz Rules:</strong> Questions and answers are randomized. Passing threshold: {PASSING_THRESHOLD}%</span>
        </div>
        <div className="quiz-progress">
          <div 
            className="progress-bar"
            role="progressbar" 
            aria-valuenow={Math.round(progress)} 
            aria-valuemin="0" 
            aria-valuemax="100"
            aria-label={`Quiz progress: Question ${currentQuestion + 1} of ${questions.length}`}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="question-container">
        <div className="question-card">
          <div className="question-header">
            <h2>Question {currentQuestion + 1}</h2>
            <div className="question-points">
              <Star size={16} />
              1 point
            </div>
          </div>

          <div className="question-text">
            {currentQ.question_text}
          </div>

          <div className="answer-options">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === currentQ.correct_answer;
              let optionClass = 'answer-option';
              
              if (answerSubmitted) {
                if (isCorrectAnswer) {
                  optionClass += ' correct';
                } else if (isSelected && !isAnswerCorrect) {
                  optionClass += ' incorrect';
                }
              } else if (isSelected) {
                optionClass += ' selected';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={optionClass}
                  disabled={answerSubmitted}
                >
                  <div className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="option-text">{option}</div>
                  {answerSubmitted && isCorrectAnswer && (
                    <CheckCircle size={16} className="correct-icon" />
                  )}
                  {answerSubmitted && isSelected && !isAnswerCorrect && (
                    <XCircle size={16} className="incorrect-icon" />
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="explanation-container">
              <div className="explanation-header">
                <Info size={20} />
                <h3>Explanation</h3>
              </div>
              <div className="explanation-content">
                <div className="correct-answer">
                  <strong>Correct Answer:</strong> {currentQ.correct_answer}
                </div>
                <div className="explanation-text">
                  <strong>Why this is correct:</strong>
                  <p>{currentQ.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="quiz-navigation">
          <div className="quiz-actions">
            {!answerSubmitted ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="btn btn-secondary"
                  title="Save your progress"
                >
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Progress'}
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="btn btn-primary"
                >
                  Submit Answer
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="btn btn-primary"
              >
                {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            )}
          </div>
          {saveStatus === 'saved' && (
            <div className="save-feedback saved">Progress saved!</div>
          )}
          {saveStatus === 'error' && (
            <div className="save-feedback error">Failed to save. Your answers are saved locally.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionQuiz;
