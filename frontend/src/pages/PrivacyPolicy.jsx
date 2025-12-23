import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

function PrivacyPolicy() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px' }}>
        <div className="auth-header">
          <h1>Privacy Policy</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ color: '#ffffff', lineHeight: '1.8', marginTop: '24px' }}>
          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>1. Information We Collect</h2>
            <p style={{ marginBottom: '12px' }}>
              We collect information that you provide directly to us, including:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '12px' }}>
              <li>Email address and display name</li>
              <li>Password (stored as a secure hash)</li>
              <li>Learning progress and quiz results</li>
              <li>XP points and achievement data</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>2. How We Use Your Information</h2>
            <p style={{ marginBottom: '12px' }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '12px' }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Track your learning progress and achievements</li>
              <li>Send you important updates about the platform</li>
              <li>Generate leaderboards and gamification features</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>3. Data Security</h2>
            <p style={{ marginBottom: '12px' }}>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your passwords are hashed using industry-standard encryption.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>4. Data Retention</h2>
            <p style={{ marginBottom: '12px' }}>
              We retain your personal information for as long as your account is active or as needed to provide you services. If you wish to delete your account, please contact us.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>5. Your Rights</h2>
            <p style={{ marginBottom: '12px' }}>
              You have the right to:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '12px' }}>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>6. Cookies</h2>
            <p style={{ marginBottom: '12px' }}>
              We use cookies to maintain your session and improve your experience. These cookies are essential for the platform to function properly.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>7. Changes to This Policy</h2>
            <p style={{ marginBottom: '12px' }}>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>8. Contact Us</h2>
            <p style={{ marginBottom: '12px' }}>
              If you have any questions about this Privacy Policy, please contact us through the platform.
            </p>
          </section>
        </div>

        <div className="auth-footer">
          {user ? (
            <button 
              onClick={() => navigate(-1)} 
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              ← Back
            </button>
          ) : (
            <Link to="/register" className="auth-link">
              ← Back to Registration
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;

