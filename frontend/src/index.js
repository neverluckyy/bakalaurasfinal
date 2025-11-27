import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Configure axios to send cookies with all requests
axios.defaults.withCredentials = true;

// Configure axios base URL
// In production, this will be set via REACT_APP_API_URL environment variable
// If not set, it defaults to the same origin (relative URL)
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = 'http://localhost:5000';
} else if (process.env.REACT_APP_API_URL) {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL;
} else {
  // Fallback: use relative URL (same domain)
  axios.defaults.baseURL = '';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
