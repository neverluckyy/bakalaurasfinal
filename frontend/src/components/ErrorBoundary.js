import React from 'react';
import { AlertCircle, RefreshCw, Home, ChevronLeft } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  handleGoBack = () => {
    this.handleReset();
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      const { error, errorInfo } = this.state;
      const { fallback } = this.props;

      // Allow custom fallback UI
      if (fallback) {
        return fallback(error, errorInfo, this.handleReset);
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon-wrapper">
              <AlertCircle className="error-icon" size={64} />
            </div>
            
            <h1 className="error-title">Oops! Something went wrong</h1>
            <p className="error-message">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary error-action-btn"
              >
                <RefreshCw size={20} />
                Try Again
              </button>
              
              <button 
                onClick={this.handleGoBack}
                className="btn btn-secondary error-action-btn"
              >
                <ChevronLeft size={20} />
                Go Back
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="btn btn-secondary error-action-btn"
              >
                <Home size={20} />
                Go Home
              </button>
            </div>

            {isDevelopment && error && (
              <details className="error-details">
                <summary className="error-details-summary">
                  Error Details (Development Only)
                </summary>
                <div className="error-details-content">
                  <div className="error-details-section">
                    <strong>Error:</strong>
                    <pre className="error-stack">{error.toString()}</pre>
                  </div>
                  {errorInfo && errorInfo.componentStack && (
                    <div className="error-details-section">
                      <strong>Component Stack:</strong>
                      <pre className="error-stack">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                  {error.stack && (
                    <div className="error-details-section">
                      <strong>Stack Trace:</strong>
                      <pre className="error-stack">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="error-support">
              <p>
                If this problem persists, please{' '}
                <a href="/support" className="error-support-link">
                  contact support
                </a>
                {' '}and let us know what you were doing when this happened.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

