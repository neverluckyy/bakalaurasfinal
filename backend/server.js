const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const questionRoutes = require('./routes/questions');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/user');
const sectionRoutes = require('./routes/sections');
const learningContentRoutes = require('./routes/learning-content');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration
// Explicitly allow both custom domain and Netlify subdomain
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production' 
    ? [
        'https://sensebait.pro', 
        'https://www.sensebait.pro',
        'https://beamish-granita-b7abb8.netlify.app' // Explicit Netlify subdomain
      ] 
    : ['http://localhost:3000'];

// Add Netlify domains pattern to allow all Netlify subdomains (including future ones)
if (process.env.NODE_ENV === 'production') {
  // Allow all Netlify subdomains via regex pattern
  allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 50, // Increased for testing (was 5)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/avatars', express.static(path.join(__dirname, '../frontend/public/avatars')));
app.use('/phishing-examples', express.static(path.join(__dirname, '../frontend/public/phishing-examples')));

// Routes
// Test endpoint to verify routes are loading
app.get('/api/test', (req, res) => {
  res.json({ message: 'Routes are working!', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/learning-content', learningContentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error middleware caught:', err);
  console.error('Stack:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('Starting server initialization...');
    console.log('Loading routes...');
    
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
      console.log('Routes registered:');
      console.log('  - /api/health');
      console.log('  - /api/test');
      console.log('  - /api/auth/*');
      console.log('  - /api/modules/*');
      console.log('  - /api/user/*');
      console.log('  - /api/sections/*');
      console.log('  - /api/support/*');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

startServer();
