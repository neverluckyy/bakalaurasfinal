import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import './Auth.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    // Verify email
    axios.get(`/api/auth/verify-email?token=${token}`)
      .then(response => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        // Refresh user data and redirect to home after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      })
      .catch(error => {
        const errorMessage = error.response?.data?.error || 'Failed to verify email';
        setStatus('error');
        setMessage(errorMessage);
        
        if (errorMessage.includes('expired')) {
          setStatus('expired');
        }
      });
  }, [token, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Please provide your email address');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    
    try {
      await axios.post('/api/auth/resend-verification', { email });
      setResendSuccess(true);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Mail size={48} className="auth-icon" />
          <h1>Email Verification</h1>
        </div>

        <div className="auth-content">
          {status === 'loading' && (
            <div className="verification-status">
              <Loader className="spinner-icon" size={48} />
              <p>Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verification-status">
              <CheckCircle size={48} className="success-icon" />
              <p className="success-message">{message}</p>
              <p className="redirect-message">Redirecting to login page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="verification-status">
              <XCircle size={48} className="error-icon" />
              <p className="error-message">{message}</p>
              {email && (
                <div className="resend-section">
                  <p>Didn't receive the email?</p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="btn btn-secondary"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {status === 'expired' && (
            <div className="verification-status">
              <XCircle size={48} className="error-icon" />
              <p className="error-message">This verification link has expired.</p>
              {email ? (
                <div className="resend-section">
                  <p>We can send you a new verification email.</p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="btn btn-secondary"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              ) : (
                <p>Please request a new verification email from the login page.</p>
              )}
            </div>
          )}

          {resendSuccess && (
            <div className="message success">
              Verification email sent! Please check your inbox.
            </div>
          )}

          <div className="auth-footer">
            <Link to="/login" className="auth-link">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;

