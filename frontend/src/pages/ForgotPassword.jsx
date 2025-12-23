import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Mail size={48} className="auth-icon" />
          <h1>Forgot Password</h1>
          <p className="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        {success ? (
          <div className="auth-content">
            <div className="verification-status">
              <CheckCircle size={48} className="success-icon" />
              <p className="success-message">
                If an account exists with this email, a password reset link has been sent.
                Please check your inbox and follow the instructions.
              </p>
              <p className="info-message">
                The reset link will expire in 1 hour.
              </p>
            </div>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">Back to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="message error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <Mail size={16} />
                  Send Reset Link
                </>
              )}
            </button>

            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

