import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { validatePassword, validateEmail, validateDisplayName } from '../utils/passwordValidation';
import './Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('robot_coral');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Validation states
  const [emailErrors, setEmailErrors] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordWarnings, setPasswordWarnings] = useState([]);
  const [passwordScore, setPasswordScore] = useState(0);
  const [displayNameErrors, setDisplayNameErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const avatars = [
    'robot_coral',
    'robot_gold',
    'robot_lavender',
    'robot_mint',
    'robot_sky'
  ];

  // Real-time validation handlers
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const validation = validateEmail(value);
    setEmailErrors(validation.errors);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
    setPasswordWarnings(validation.warnings || []);
    setPasswordScore(validation.score || 0);
    
    // Clear confirm password error if passwords match
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

  const handleDisplayNameChange = (e) => {
    const value = e.target.value;
    setDisplayName(value);
    const validation = validateDisplayName(value);
    setDisplayNameErrors(validation.errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all fields
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const displayNameValidation = validateDisplayName(displayName);
    
    setEmailErrors(emailValidation.errors);
    setPasswordErrors(passwordValidation.errors);
    setPasswordWarnings(passwordValidation.warnings || []);
    setPasswordScore(passwordValidation.score || 0);
    setDisplayNameErrors(displayNameValidation.errors);
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }

    // Check if all validations pass
    if (!emailValidation.isValid || !passwordValidation.isValid || !displayNameValidation.isValid) {
      setError('Please fix the errors in the form before submitting');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms of Use and Privacy Policy to continue');
      setLoading(false);
      return;
    }

    // Ensure selectedAvatar is passed correctly
    if (!selectedAvatar) {
      setError('Please select an avatar');
      setLoading(false);
      return;
    }
    
    const result = await register(email, password, displayName, selectedAvatar);
    
    if (result.success) {
      // Show success message and redirect to home
      // The home page will show a notification if email is not verified
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join the security learning community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <div className="input-group">
              <User className="input-icon" />
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={handleDisplayNameChange}
                placeholder="Enter your display name"
                className={`input ${displayNameErrors.length > 0 ? 'input-error' : ''}`}
                required
              />
            </div>
            {displayNameErrors.length > 0 && (
              <div className="validation-message error">
                {displayNameErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-group">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className={`input ${emailErrors.length > 0 ? 'input-error' : ''}`}
                required
              />
            </div>
            {emailErrors.length > 0 && (
              <div className="validation-message error">
                {emailErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password (min. 8 characters)"
                className={`input ${passwordErrors.length > 0 ? 'input-error' : ''}`}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
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
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                className={`input ${confirmPasswordError ? 'input-error' : ''}`}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {confirmPasswordError && (
              <div className="validation-message error">
                {confirmPasswordError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Choose Your Avatar</label>
            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img
                    src={`/avatars/${avatar}.svg`}
                    alt={avatar}
                    className="avatar-image"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{
                  marginTop: '4px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <label 
                htmlFor="acceptTerms" 
                style={{ 
                  color: '#ffffff', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  lineHeight: '1.5'
                }}
              >
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="auth-link" style={{ textDecoration: 'underline' }}>
                  Terms of Use
                </Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="auth-link" style={{ textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
