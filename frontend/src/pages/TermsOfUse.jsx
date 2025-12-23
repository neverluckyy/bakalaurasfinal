import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

function TermsOfUse() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px' }}>
        <div className="auth-header">
          <h1>Terms of Use</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ color: '#ffffff', lineHeight: '1.8', marginTop: '24px' }}>
          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '12px' }}>
              By accessing and using this security learning platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>2. Use License</h2>
            <p style={{ marginBottom: '12px' }}>
              Permission is granted to temporarily access the materials on this platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '12px' }}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the platform</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>3. User Account</h2>
            <p style={{ marginBottom: '12px' }}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>4. Disclaimer</h2>
            <p style={{ marginBottom: '12px' }}>
              The materials on this platform are provided on an 'as is' basis. The platform makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>5. Limitations</h2>
            <p style={{ marginBottom: '12px' }}>
              In no event shall the platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this platform.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#6A5ACD', marginBottom: '12px', fontSize: '20px' }}>6. Revisions</h2>
            <p style={{ marginBottom: '12px' }}>
              The platform may revise these terms of service at any time without notice. By using this platform you are agreeing to be bound by the then current version of these terms of service.
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

export default TermsOfUse;

