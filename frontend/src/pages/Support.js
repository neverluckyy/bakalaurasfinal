import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircle, Mail, MessageSquare, Send, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './Support.css';

const Support = () => {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.display_name || '',
    email: user?.email || '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on "Forgot Password" on the login page. You will receive an email with a link to reset your password. The link expires in 1 hour.'
    },
    {
      id: 2,
      question: 'How do I verify my email address?',
      answer: 'After registering, you will receive a verification email. Click the link in the email to verify your account. If you didn\'t receive the email, check your spam folder or request a new verification email from your profile.'
    },
    {
      id: 3,
      question: 'How does the XP and leveling system work?',
      answer: 'You earn XP by completing quizzes and answering questions correctly. Each 100 XP increases your level. Your level determines your security title (Security Beginner, Security Enthusiast, Security Specialist, Security Expert, or Security Master).'
    },
    {
      id: 4,
      question: 'What happens if I fail a quiz?',
      answer: 'You can retake quizzes as many times as needed. Focus on learning the material and understanding the explanations provided for each question. Your progress is saved, so you can continue improving.'
    },
    {
      id: 5,
      question: 'How do I change my email address?',
      answer: 'Go to Settings from your Profile page. Enter your new email address and save. You will receive a verification email at the new address. The change will only complete after you verify the new email.'
    },
    {
      id: 6,
      question: 'Can I change my avatar?',
      answer: 'Yes! Go to Settings from your Profile page. You can choose from several robot avatars to personalize your profile.'
    },
    {
      id: 7,
      question: 'How is my leaderboard ranking calculated?',
      answer: 'Your ranking is based on your total XP. The more XP you earn by completing modules and quizzes, the higher you will rank on the leaderboard.'
    },
    {
      id: 8,
      question: 'I\'m having technical issues. What should I do?',
      answer: 'Please use the contact form below to report technical issues. Include as much detail as possible, such as what you were doing when the issue occurred, your browser type, and any error messages you saw.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (message || error) {
      setMessage('');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/support/contact', formData, {
        withCredentials: true
      });
      
      setMessage('Thank you for contacting us! We have received your message and will get back to you soon.');
      setFormData({
        name: user?.display_name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'general'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <div className="support-header-icon">
          <HelpCircle size={48} />
        </div>
        <h1>Support & Contact</h1>
        <p>We're here to help! Find answers to common questions or contact our support team.</p>
      </div>

      <div className="support-content">
        {/* Contact Information Section */}
        <div className="contact-info-section">
          <h2>Contact Information</h2>
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-card-icon">
                <Mail size={24} />
              </div>
              <div className="contact-card-content">
                <h3>Email Support</h3>
                <p>Send us an email anytime</p>
                <a href="mailto:info@sensebait.pro" className="contact-link">
                  info@sensebait.pro
                </a>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">
                <MessageSquare size={24} />
              </div>
              <div className="contact-card-content">
                <h3>Contact Form</h3>
                <p>Use the form below to submit a ticket</p>
                <span className="contact-link">Available 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={activeFaq === faq.id}
                >
                  <span>{faq.question}</span>
                  {activeFaq === faq.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
                {activeFaq === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="contact-form-section">
          <h2>Send us a Message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            {message && (
              <div className="alert alert-success">
                <CheckCircle size={20} />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account Issue</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="Brief description of your inquiry"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows="6"
                placeholder="Please provide as much detail as possible..."
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Support;

