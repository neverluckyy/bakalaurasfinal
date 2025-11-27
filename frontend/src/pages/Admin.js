import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  X,
  Save,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import './Admin.css';

function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Dashboard stats
  const [stats, setStats] = useState(null);

  // Modules
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({ name: '', display_name: '', description: '', order_index: 0 });

  // Sections
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionForm, setSectionForm] = useState({ module_id: '', name: '', display_name: '', description: '', order_index: 0 });

  // Questions
  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    section_id: '',
    question_text: '',
    options: ['', ''],
    correct_answer: '',
    explanation: '',
    question_type: 'multiple_choice'
  });

  // Learning Content
  const [learningContent, setLearningContent] = useState([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentForm, setContentForm] = useState({
    section_id: '',
    screen_title: '',
    read_time_min: 5,
    content_markdown: '',
    order_index: 0
  });

  // Users
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchStats();
      fetchModules();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedModule && selectedModule.id) {
      fetchSections(selectedModule.id);
    } else {
      setSections([]);
    }
  }, [selectedModule]);

  useEffect(() => {
    if (selectedSection) {
      fetchQuestions(selectedSection.id);
      fetchLearningContent(selectedSection.id);
    }
  }, [selectedSection]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats', { withCredentials: true });
      setStats(response.data);
    } catch (err) {
      setError('Failed to load statistics');
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/admin/modules', { withCredentials: true });
      setModules(response.data);
    } catch (err) {
      setError('Failed to load modules');
    }
  };

  const fetchSections = async (moduleId) => {
    if (!moduleId) {
      console.error('No module ID provided to fetchSections');
      setError('Module ID is required to load sections');
      return;
    }
    
    // Ensure moduleId is a number
    const id = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
    if (isNaN(id)) {
      console.error('Invalid module ID:', moduleId);
      setError('Invalid module ID');
      return;
    }
    
    try {
      const response = await axios.get(`/api/admin/modules/${id}/sections`, { withCredentials: true });
      setSections(response.data || []);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching sections:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load sections';
      setError(`Failed to load sections: ${errorMsg}`);
    }
  };

  const fetchQuestions = async (sectionId) => {
    try {
      const response = await axios.get(`/api/admin/sections/${sectionId}/questions`, { withCredentials: true });
      setQuestions(response.data);
    } catch (err) {
      setError('Failed to load questions');
    }
  };

  const fetchLearningContent = async (sectionId) => {
    try {
      const response = await axios.get(`/api/admin/sections/${sectionId}/learning-content`, { withCredentials: true });
      setLearningContent(response.data);
    } catch (err) {
      setError('Failed to load learning content');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users', { withCredentials: true });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (selectedModule) {
        await axios.put(`/api/admin/modules/${selectedModule.id}`, moduleForm, { withCredentials: true });
        setMessage('Module updated successfully');
      } else {
        await axios.post('/api/admin/modules', moduleForm, { withCredentials: true });
        setMessage('Module created successfully');
      }
      fetchModules();
      setShowModuleForm(false);
      setSelectedModule(null);
      setModuleForm({ name: '', display_name: '', description: '', order_index: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save module');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const moduleId = sectionForm.module_id || selectedModule?.id;
      if (!moduleId) {
        setError('Module ID is required');
        setLoading(false);
        return;
      }

      if (selectedSection) {
        await axios.put(`/api/admin/sections/${selectedSection.id}`, sectionForm, { withCredentials: true });
        setMessage('Section updated successfully');
      } else {
        await axios.post('/api/admin/sections', sectionForm, { withCredentials: true });
        setMessage('Section created successfully');
      }
      
      // Use the moduleId from the form or selectedModule
      // Make sure we preserve the selectedModule so sections can be fetched
      const currentModule = selectedModule || modules.find(m => m.id === moduleId);
      if (currentModule) {
        setSelectedModule(currentModule);
      }
      
      // Fetch sections with the module ID
      await fetchSections(moduleId);
      // Also refresh modules to update section counts
      await fetchModules();
      
      setShowSectionForm(false);
      setSelectedSection(null);
      // Don't clear module_id yet - keep it for potential retry
      setSectionForm({ module_id: moduleId, name: '', display_name: '', description: '', order_index: 0 });
    } catch (err) {
      console.error('Error saving section:', err);
      setError(err.response?.data?.error || 'Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const filteredOptions = questionForm.options.filter(opt => opt.trim() !== '');
      if (filteredOptions.length < 2) {
        setError('At least 2 options are required');
        setLoading(false);
        return;
      }

      if (selectedQuestion) {
        await axios.put(`/api/admin/questions/${selectedQuestion.id}`, {
          ...questionForm,
          options: filteredOptions
        }, { withCredentials: true });
        setMessage('Question updated successfully');
      } else {
        await axios.post('/api/admin/questions', {
          ...questionForm,
          options: filteredOptions
        }, { withCredentials: true });
        setMessage('Question created successfully');
      }
      fetchQuestions(selectedSection.id);
      setShowQuestionForm(false);
      setSelectedQuestion(null);
      setQuestionForm({
        section_id: selectedSection.id,
        question_text: '',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        question_type: 'multiple_choice'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (selectedContent) {
        await axios.put(`/api/admin/learning-content/${selectedContent.id}`, contentForm, { withCredentials: true });
        setMessage('Learning content updated successfully');
      } else {
        await axios.post('/api/admin/learning-content', contentForm, { withCredentials: true });
        setMessage('Learning content created successfully');
      }
      fetchLearningContent(selectedSection.id);
      setShowContentForm(false);
      setSelectedContent(null);
      setContentForm({
        section_id: selectedSection.id,
        screen_title: '',
        read_time_min: 5,
        content_markdown: '',
        order_index: 0
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save learning content');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module? This will fail if it has sections.')) return;
    
    try {
      await axios.delete(`/api/admin/modules/${id}`, { withCredentials: true });
      setMessage('Module deleted successfully');
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete module');
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section? This will fail if it has questions or content.')) return;
    
    try {
      await axios.delete(`/api/admin/sections/${id}`, { withCredentials: true });
      setMessage('Section deleted successfully');
      fetchSections(selectedModule.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete section');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await axios.delete(`/api/admin/questions/${id}`, { withCredentials: true });
      setMessage('Question deleted successfully');
      fetchQuestions(selectedSection.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this learning content?')) return;
    
    try {
      await axios.delete(`/api/admin/learning-content/${id}`, { withCredentials: true });
      setMessage('Learning content deleted successfully');
      fetchLearningContent(selectedSection.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete learning content');
    }
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    if (userId === user.id) {
      setError('You cannot change your own admin status');
      return;
    }

    try {
      await axios.put(`/api/admin/users/${userId}`, { is_admin: !isAdmin }, { withCredentials: true });
      setMessage(`User ${!isAdmin ? 'promoted to' : 'removed from'} admin successfully`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);

  const openModuleForm = (module = null) => {
    if (module) {
      setSelectedModule(module);
      setModuleForm({
        name: module.name,
        display_name: module.display_name,
        description: module.description || '',
        order_index: module.order_index
      });
    } else {
      setSelectedModule(null);
      setModuleForm({ name: '', display_name: '', description: '', order_index: modules.length });
    }
    setShowModuleForm(true);
  };

  const openSectionForm = (section = null, module = null) => {
    const targetModule = module || selectedModule;
    if (!targetModule) {
      setError('Please select a module first');
      return;
    }
    
    if (section) {
      setSelectedSection(section);
      setSectionForm({
        module_id: targetModule.id,
        name: section.name,
        display_name: section.display_name,
        description: section.description || '',
        order_index: section.order_index
      });
    } else {
      setSelectedSection(null);
      setSectionForm({
        module_id: targetModule.id,
        name: '',
        display_name: '',
        description: '',
        order_index: sections.length
      });
    }
    setShowSectionForm(true);
  };

  const openQuestionForm = (question = null) => {
    if (question) {
      setSelectedQuestion(question);
      setQuestionForm({
        section_id: selectedSection.id,
        question_text: question.question_text,
        options: question.options || ['', ''],
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        question_type: question.question_type || 'multiple_choice'
      });
    } else {
      setSelectedQuestion(null);
      setQuestionForm({
        section_id: selectedSection.id,
        question_text: '',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        question_type: 'multiple_choice'
      });
    }
    setShowQuestionForm(true);
  };

  const openContentForm = (content = null) => {
    if (content) {
      setSelectedContent(content);
      setContentForm({
        section_id: selectedSection.id,
        screen_title: content.screen_title,
        read_time_min: content.read_time_min,
        content_markdown: content.content_markdown,
        order_index: content.order_index
      });
    } else {
      setSelectedContent(null);
      setContentForm({
        section_id: selectedSection.id,
        screen_title: '',
        read_time_min: 5,
        content_markdown: '',
        order_index: learningContent.length
      });
    }
    setShowContentForm(true);
  };

  const addQuestionOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, '']
    });
  };

  const removeQuestionOption = (index) => {
    if (questionForm.options.length > 2) {
      setQuestionForm({
        ...questionForm,
        options: questionForm.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateQuestionOption = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  if (!user?.is_admin) {
    return (
      <div className="admin-container">
        <div className="admin-error">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage courses, content, and users</p>
      </div>

      {error && (
        <div className="admin-message error" onClick={() => setError('')}>
          {error} <X size={16} />
        </div>
      )}

      {message && (
        <div className="admin-message success" onClick={() => setMessage('')}>
          {message} <X size={16} />
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button
          className={`admin-tab ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <BookOpen size={18} />
          Modules
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <Users size={24} />
                  <div className="stat-info">
                    <h3>{stats.total_users}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <BookOpen size={24} />
                  <div className="stat-info">
                    <h3>{stats.total_modules}</h3>
                    <p>Modules</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FileText size={24} />
                  <div className="stat-info">
                    <h3>{stats.total_sections}</h3>
                    <p>Sections</p>
                  </div>
                </div>
                <div className="stat-card">
                  <HelpCircle size={24} />
                  <div className="stat-info">
                    <h3>{stats.total_questions}</h3>
                    <p>Questions</p>
                  </div>
                </div>
                <div className="stat-card">
                  <FileText size={24} />
                  <div className="stat-info">
                    <h3>{stats.total_content}</h3>
                    <p>Content Items</p>
                  </div>
                </div>
                <div className="stat-card">
                  <Users size={24} />
                  <div className="stat-info">
                    <h3>{stats.admin_count}</h3>
                    <p>Admins</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading">Loading statistics...</div>
            )}
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="admin-modules">
            <div className="admin-section-header">
              <h2>Modules</h2>
              <button className="btn btn-primary" onClick={() => openModuleForm()}>
                <Plus size={16} />
                Add Module
              </button>
            </div>

            {showModuleForm && (
              <div className="admin-form-modal">
                <div className="admin-form">
                  <div className="form-header">
                    <h3>{selectedModule ? 'Edit Module' : 'Create Module'}</h3>
                    <button className="close-btn" onClick={() => {
                      setShowModuleForm(false);
                      setSelectedModule(null);
                    }}>
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleModuleSubmit}>
                    <div className="form-group">
                      <label>Name (unique identifier)</label>
                      <input
                        type="text"
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                        required
                        placeholder="module_name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Display Name</label>
                      <input
                        type="text"
                        value={moduleForm.display_name}
                        onChange={(e) => setModuleForm({ ...moduleForm, display_name: e.target.value })}
                        required
                        placeholder="Module Display Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        rows="3"
                        placeholder="Module description"
                      />
                    </div>
                    <div className="form-group">
                      <label>Order Index</label>
                      <input
                        type="number"
                        value={moduleForm.order_index}
                        onChange={(e) => setModuleForm({ ...moduleForm, order_index: parseInt(e.target.value) })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => {
                        setShowModuleForm(false);
                        setSelectedModule(null);
                      }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="modules-list">
              {modules.map((module) => (
                <div key={module.id} className="module-item">
                  <div className="module-item-header" onClick={() => {
                    if (selectedModule?.id === module.id) {
                      setSelectedModule(null);
                      setSections([]);
                    } else {
                      setSelectedModule(module);
                    }
                  }}>
                    <div className="module-item-info">
                      {selectedModule?.id === module.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <div>
                        <h3>{module.display_name}</h3>
                        <p>{module.description || 'No description'}</p>
                        <span className="module-meta">{module.section_count} sections • {module.question_count} questions</span>
                      </div>
                    </div>
                    <div className="module-item-actions">
                      <button className="btn-icon" onClick={(e) => {
                        e.stopPropagation();
                        openModuleForm(module);
                      }}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon danger" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id);
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {selectedModule?.id === module.id && (
                    <div className="module-sections">
                      <div className="admin-section-header">
                        <h3>Sections</h3>
                        <button className="btn btn-primary" onClick={(e) => {
                          e.stopPropagation();
                          openSectionForm(null, module);
                        }}>
                          <Plus size={16} />
                          Add Section
                        </button>
                      </div>

                      {showSectionForm && (
                        <div className="admin-form-modal">
                          <div className="admin-form">
                            <div className="form-header">
                              <h3>{selectedSection ? 'Edit Section' : 'Create Section'}</h3>
                              <button className="close-btn" onClick={() => {
                                setShowSectionForm(false);
                                setSelectedSection(null);
                              }}>
                                <X size={20} />
                              </button>
                            </div>
                            <form onSubmit={handleSectionSubmit}>
                              <div className="form-group">
                                <label>Name (unique identifier)</label>
                                <input
                                  type="text"
                                  value={sectionForm.name}
                                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                  required
                                  placeholder="section_name"
                                />
                              </div>
                              <div className="form-group">
                                <label>Display Name</label>
                                <input
                                  type="text"
                                  value={sectionForm.display_name}
                                  onChange={(e) => setSectionForm({ ...sectionForm, display_name: e.target.value })}
                                  required
                                  placeholder="Section Display Name"
                                />
                              </div>
                              <div className="form-group">
                                <label>Description</label>
                                <textarea
                                  value={sectionForm.description}
                                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                                  rows="3"
                                  placeholder="Section description"
                                />
                              </div>
                              <div className="form-group">
                                <label>Order Index</label>
                                <input
                                  type="number"
                                  value={sectionForm.order_index}
                                  onChange={(e) => setSectionForm({ ...sectionForm, order_index: parseInt(e.target.value) })}
                                  required
                                  min="0"
                                />
                              </div>
                              <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => {
                                  setShowSectionForm(false);
                                  setSelectedSection(null);
                                }}>
                                  Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                  <Save size={16} />
                                  {loading ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      <div className="sections-list">
                        {sections.map((section) => (
                          <div key={section.id} className="section-item">
                            <div className="section-item-header" onClick={() => {
                              if (selectedSection?.id === section.id) {
                                setSelectedSection(null);
                                setQuestions([]);
                                setLearningContent([]);
                              } else {
                                setSelectedSection(section);
                              }
                            }}>
                              <div className="section-item-info">
                                {selectedSection?.id === section.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <div>
                                  <h4>{section.display_name}</h4>
                                  <span className="section-meta">{section.question_count} questions • {section.content_count} content items</span>
                                </div>
                              </div>
                              <div className="section-item-actions">
                                <button className="btn-icon" onClick={(e) => {
                                  e.stopPropagation();
                                  openSectionForm(section, module);
                                }}>
                                  <Edit size={14} />
                                </button>
                                <button className="btn-icon danger" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSection(section.id);
                                }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {selectedSection?.id === section.id && (
                              <div className="section-details">
                                <div className="detail-section">
                                  <div className="detail-header">
                                    <h4>Questions</h4>
                                    <button className="btn btn-primary small" onClick={() => openQuestionForm()}>
                                      <Plus size={14} />
                                      Add Question
                                    </button>
                                  </div>

                                  {showQuestionForm && (
                                    <div className="admin-form-modal">
                                      <div className="admin-form">
                                        <div className="form-header">
                                          <h3>{selectedQuestion ? 'Edit Question' : 'Create Question'}</h3>
                                          <button className="close-btn" onClick={() => {
                                            setShowQuestionForm(false);
                                            setSelectedQuestion(null);
                                          }}>
                                            <X size={20} />
                                          </button>
                                        </div>
                                        <form onSubmit={handleQuestionSubmit}>
                                          <div className="form-group">
                                            <label>Question Text</label>
                                            <textarea
                                              value={questionForm.question_text}
                                              onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                              required
                                              rows="3"
                                              placeholder="Enter the question"
                                            />
                                          </div>
                                          <div className="form-group">
                                            <label>Options</label>
                                            {questionForm.options.map((option, index) => (
                                              <div key={index} className="option-input">
                                                <input
                                                  type="text"
                                                  value={option}
                                                  onChange={(e) => updateQuestionOption(index, e.target.value)}
                                                  placeholder={`Option ${index + 1}`}
                                                  required={index < 2}
                                                />
                                                {questionForm.options.length > 2 && (
                                                  <button
                                                    type="button"
                                                    className="btn-icon danger"
                                                    onClick={() => removeQuestionOption(index)}
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              className="btn btn-secondary small"
                                              onClick={addQuestionOption}
                                            >
                                              <Plus size={14} />
                                              Add Option
                                            </button>
                                          </div>
                                          <div className="form-group">
                                            <label>Correct Answer</label>
                                            <select
                                              value={questionForm.correct_answer}
                                              onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                                              required
                                            >
                                              <option value="">Select correct answer</option>
                                              {questionForm.options.filter(opt => opt.trim() !== '').map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="form-group">
                                            <label>Explanation</label>
                                            <textarea
                                              value={questionForm.explanation}
                                              onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                              required
                                              rows="3"
                                              placeholder="Explain why this is the correct answer"
                                            />
                                          </div>
                                          <div className="form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => {
                                              setShowQuestionForm(false);
                                              setSelectedQuestion(null);
                                            }}>
                                              Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                              <Save size={16} />
                                              {loading ? 'Saving...' : 'Save'}
                                            </button>
                                          </div>
                                        </form>
                                      </div>
                                    </div>
                                  )}

                                  <div className="questions-list">
                                    {questions.map((question) => (
                                      <div key={question.id} className="question-item">
                                        <div className="question-text">{question.question_text}</div>
                                        <div className="question-actions">
                                          <button className="btn-icon" onClick={() => openQuestionForm(question)}>
                                            <Edit size={14} />
                                          </button>
                                          <button className="btn-icon danger" onClick={() => handleDeleteQuestion(question.id)}>
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {questions.length === 0 && (
                                      <p className="empty-state">No questions yet. Add one to get started.</p>
                                    )}
                                  </div>
                                </div>

                                <div className="detail-section">
                                  <div className="detail-header">
                                    <h4>Learning Content</h4>
                                    <button className="btn btn-primary small" onClick={() => openContentForm()}>
                                      <Plus size={14} />
                                      Add Content
                                    </button>
                                  </div>

                                  {showContentForm && (
                                    <div className="admin-form-modal">
                                      <div className="admin-form">
                                        <div className="form-header">
                                          <h3>{selectedContent ? 'Edit Learning Content' : 'Create Learning Content'}</h3>
                                          <button className="close-btn" onClick={() => {
                                            setShowContentForm(false);
                                            setSelectedContent(null);
                                          }}>
                                            <X size={20} />
                                          </button>
                                        </div>
                                        <form onSubmit={handleContentSubmit}>
                                          <div className="form-group">
                                            <label>Screen Title</label>
                                            <input
                                              type="text"
                                              value={contentForm.screen_title}
                                              onChange={(e) => setContentForm({ ...contentForm, screen_title: e.target.value })}
                                              required
                                              placeholder="Content screen title"
                                            />
                                          </div>
                                          <div className="form-group">
                                            <label>Read Time (minutes)</label>
                                            <input
                                              type="number"
                                              value={contentForm.read_time_min}
                                              onChange={(e) => setContentForm({ ...contentForm, read_time_min: parseInt(e.target.value) })}
                                              required
                                              min="1"
                                            />
                                          </div>
                                          <div className="form-group">
                                            <label>Content (Markdown)</label>
                                            <textarea
                                              value={contentForm.content_markdown}
                                              onChange={(e) => setContentForm({ ...contentForm, content_markdown: e.target.value })}
                                              required
                                              rows="10"
                                              placeholder="Enter markdown content"
                                            />
                                          </div>
                                          <div className="form-group">
                                            <label>Order Index</label>
                                            <input
                                              type="number"
                                              value={contentForm.order_index}
                                              onChange={(e) => setContentForm({ ...contentForm, order_index: parseInt(e.target.value) })}
                                              required
                                              min="0"
                                            />
                                          </div>
                                          <div className="form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => {
                                              setShowContentForm(false);
                                              setSelectedContent(null);
                                            }}>
                                              Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                              <Save size={16} />
                                              {loading ? 'Saving...' : 'Save'}
                                            </button>
                                          </div>
                                        </form>
                                      </div>
                                    </div>
                                  )}

                                  <div className="content-list">
                                    {learningContent.map((content) => (
                                      <div key={content.id} className="content-item">
                                        <div className="content-info">
                                          <h5>{content.screen_title}</h5>
                                          <span className="content-meta">{content.read_time_min} min read • Order: {content.order_index}</span>
                                        </div>
                                        <div className="content-actions">
                                          <button className="btn-icon" onClick={() => openContentForm(content)}>
                                            <Edit size={14} />
                                          </button>
                                          <button className="btn-icon danger" onClick={() => handleDeleteContent(content.id)}>
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {learningContent.length === 0 && (
                                      <p className="empty-state">No learning content yet. Add one to get started.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {sections.length === 0 && (
                          <p className="empty-state">No sections yet. Add one to get started.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {modules.length === 0 && (
                <p className="empty-state">No modules yet. Create one to get started.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-users">
            <div className="admin-section-header">
              <h2>User Management</h2>
            </div>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Display Name</th>
                    <th>Level</th>
                    <th>XP</th>
                    <th>Admin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.display_name}</td>
                      <td>{u.level || 1}</td>
                      <td>{u.total_xp || 0}</td>
                      <td>{u.is_admin ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          className={`btn ${u.is_admin ? 'btn-secondary' : 'btn-primary'} small`}
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          disabled={u.id === user.id}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="empty-state">No users found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;

