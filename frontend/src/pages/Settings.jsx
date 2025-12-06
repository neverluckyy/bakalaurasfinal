import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Palette, Save, ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/passwordValidation';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    email: user?.email || '',
    avatar_key: user?.avatar_key || 'robot_coral'
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordWarnings, setPasswordWarnings] = useState([]);
  const [passwordScore, setPasswordScore] = useState(0);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Available avatars
  const availableAvatars = [
    { key: 'robot_coral', name: 'Coral Robot' },
    { key: 'robot_gold', name: 'Gold Robot' },
    { key: 'robot_lavender', name: 'Lavender Robot' },
    { key: 'robot_mint', name: 'Mint Robot' },
    { key: 'robot_sky', name: 'Sky Robot' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarSelect = (avatarKey) => {
    setFormData(prev => ({
      ...prev,
      avatar_key: avatarKey
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.put('/api/user/profile', formData, {
        withCredentials: true
      });
      
      // Update the user context with new data
      updateUser(response.data.user);
      
      // Check if email change requires verification
      if (response.data.requiresEmailVerification) {
        setMessage(response.data.message || 'Profile updated. Please verify your new email address. A verification email has been sent to the new address.');
      } else {
        setMessage('Profile updated successfully!');
      }
      
      // Clear message after 5 seconds (longer for verification message)
      setTimeout(() => setMessage(''), response.data.requiresEmailVerification ? 8000 : 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/profile');
  };

  // Password change handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newPassword') {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
      setPasswordWarnings(validation.warnings || []);
      setPasswordScore(validation.score || 0);
      
      // Clear confirm password error if passwords match
      if (value === passwordForm.confirmPassword && confirmPasswordError) {
        setConfirmPasswordError('');
      }
    } else if (name === 'confirmPassword') {
      if (value && value !== passwordForm.newPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    setPasswordLoading(true);

    // Validate new password
    const passwordValidation = validatePassword(passwordForm.newPassword);
    setPasswordErrors(passwordValidation.errors);
    setPasswordWarnings(passwordValidation.warnings || []);
    setPasswordScore(passwordValidation.score || 0);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }

    if (!passwordValidation.isValid) {
      setPasswordError('Please fix the errors in the password form');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await axios.put('/api/user/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        withCredentials: true
      });
      
      setPasswordMessage('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors([]);
      setPasswordWarnings([]);
      setPasswordScore(0);
      setConfirmPasswordError('');
      
      // Clear message after 3 seconds
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Profile
        </button>
        <h1>Settings</h1>
      </div>

      {message && (
        <div className="message success">
          {message}
        </div>
      )}

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      <div className="settings-content">
        <form onSubmit={handleSubmit} className="settings-form">
          {/* Profile Information Section */}
          <div className="settings-section">
            <div className="section-header">
              <User size={20} />
              <h2>Profile Information</h2>
            </div>
            
            <div className="form-group">
              <label htmlFor="display_name">Display Name</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Enter your display name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Avatar Selection Section */}
          <div className="settings-section">
            <div className="section-header">
              <Palette size={20} />
              <h2>Avatar Selection</h2>
            </div>
            
            <div className="avatar-grid">
              {availableAvatars.map((avatar) => (
                <div
                  key={avatar.key}
                  className={`avatar-option ${formData.avatar_key === avatar.key ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar.key)}
                >
                  <img
                    src={`/avatars/${avatar.key}.svg`}
                    alt={avatar.name}
                    className="avatar-preview"
                  />
                  <span className="avatar-name">{avatar.name}</span>
                  {formData.avatar_key === avatar.key && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account Security Section */}
          <div className="settings-section">
            <div className="section-header">
              <Shield size={20} />
              <h2>Change Password</h2>
            </div>
            
            {passwordMessage && (
              <div className="message success">
                {passwordMessage}
              </div>
            )}

            {passwordError && (
              <div className="message error">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    className="input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min. 8 characters)"
                    className={`input ${passwordErrors.length > 0 ? 'input-error' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                {passwordForm.newPassword.length > 0 && passwordErrors.length === 0 && (
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
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className={`input ${confirmPasswordError ? 'input-error' : ''}`}
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

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      <Save size={16} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
