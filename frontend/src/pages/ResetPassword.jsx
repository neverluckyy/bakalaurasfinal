import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { validatePassword } from '../utils/passwordValidation';
import './Auth.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('form'); // form, success, error, expired
  const [message, setMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordWarnings, setPasswordWarnings] = useState([]);
  const [passwordScore, setPasswordScore] = useState(0);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Reset token is missing');
    }
  }, [token]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
    setPasswordWarnings(validation.warnings || []);
    setPasswordScore(validation.score || 0);
    
    if (value === confirmPassword && confirmPasswordError) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value && value !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validate password
    const passwordValidation = validatePassword(password);
    setPasswordErrors(passwordValidation.errors);
    setPasswordWarnings(passwordValidation.warnings || []);
    setPasswordScore(passwordValidation.score || 0);
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }

    if (!passwordValidation.isValid) {
      setMessage('Please fix the errors in the form');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/reset-password', {
        token,
        newPassword: password
      });
      
      setStatus('success');
      setMessage('Your password has been reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      setStatus('error');
      setMessage(errorMessage);
      
      if (errorMessage.includes('expired')) {
        setStatus('expired');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <CheckCircle size={48} className="success-icon" />
            <h1>Password Reset Successful</h1>
          </div>
          <div className="auth-content">
            <div className="verification-status">
              <p className="success-message">{message}</p>
              <p className="redirect-message">Redirecting to login page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'expired') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <XCircle size={48} className="error-icon" />
            <h1>Password Reset Failed</h1>
          </div>
          <div className="auth-content">
            <div className="verification-status">
              <p className="error-message">{message}</p>
              {status === 'expired' && (
                <p>Please request a new password reset link.</p>
              )}
            </div>
            <div className="auth-footer">
              <Link to="/forgot-password" className="auth-link">Request New Reset Link</Link>
              <Link to="/login" className="auth-link">Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Lock size={48} className="auth-icon" />
          <h1>Reset Password</h1>
          <p className="auth-subtitle">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {message && (
            <div className="message error">
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className={passwordErrors.length > 0 ? 'input-error' : ''}
                required
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <div className="validation-message error">
                {passwordErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
            {passwordWarnings.length > 0 && passwordErrors.length === 0 && (
              <div className="validation-message warning">
                {passwordWarnings.map((warning, index) => (
                  <div key={index}>{warning}</div>
                ))}
              </div>
            )}
            {password.length > 0 && passwordErrors.length === 0 && (
              <div className="password-strength">
                <div className="password-strength-label">Password Strength:</div>
                <div className="password-strength-bar">
                  <div 
                    className={`password-strength-fill ${passwordScore < 30 ? 'weak' : passwordScore < 60 ? 'medium' : passwordScore < 80 ? 'good' : 'strong'}`}
                    style={{ width: `${passwordScore}%` }}
                  ></div>
                </div>
                <div className="password-strength-text">
                  {passwordScore < 30 ? 'Weak' : passwordScore < 60 ? 'Medium' : passwordScore < 80 ? 'Good' : 'Strong'}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm new password"
                className={confirmPasswordError ? 'input-error' : ''}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPasswordError && (
              <div className="validation-message error">
                {confirmPasswordError}
              </div>
            )}
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
                <Lock size={16} />
                Reset Password
              </>
            )}
          </button>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

