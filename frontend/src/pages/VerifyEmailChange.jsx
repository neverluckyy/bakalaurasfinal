import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import './Auth.css';

function VerifyEmailChange() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    // Verify email change
    axios.get(`/api/user/verify-email-change?token=${token}`)
      .then(response => {
        setStatus('success');
        setMessage('Your email address has been changed successfully!');
        // Redirect to settings after 3 seconds
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      })
      .catch(error => {
        const errorMessage = error.response?.data?.error || 'Failed to verify email change';
        setStatus('error');
        setMessage(errorMessage);
        
        if (errorMessage.includes('expired')) {
          setStatus('expired');
        }
      });
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Mail size={48} className="auth-icon" />
          <h1>Email Change Verification</h1>
        </div>

        <div className="auth-content">
          {status === 'loading' && (
            <div className="verification-status">
              <Loader className="spinner-icon" size={48} />
              <p>Verifying your new email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verification-status">
              <CheckCircle size={48} className="success-icon" />
              <p className="success-message">{message}</p>
              <p className="redirect-message">Redirecting to settings...</p>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="verification-status">
              <XCircle size={48} className="error-icon" />
              <p className="error-message">{message}</p>
              {status === 'expired' && (
                <p>Please request a new email change from your settings page.</p>
              )}
            </div>
          )}

          <div className="auth-footer">
            <Link to="/settings" className="auth-link">Go to Settings</Link>
            <Link to="/" className="auth-link">Go to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailChange;

