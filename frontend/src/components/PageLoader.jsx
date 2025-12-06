import React from 'react';
import './PageLoader.css';

/**
 * Loading component shown while lazy-loaded pages are being fetched
 * Matches the app's design and provides visual feedback
 */
function PageLoader() {
  return (
    <div className="page-loader-container">
      <div className="page-loader">
        <div className="page-loader-spinner"></div>
        <p className="page-loader-text">Loading...</p>
      </div>
    </div>
  );
}

export default PageLoader;

