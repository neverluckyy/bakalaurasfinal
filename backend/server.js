const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
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
const maintenanceRoutes = require('./routes/maintenance');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - configure Helmet to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration
// Explicitly allow both custom domain and Netlify subdomain
let allowedOrigins = [];

if (process.env.ALLOWED_ORIGINS) {
  // If ALLOWED_ORIGINS is set, use it and also add Netlify pattern
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  // Always add Netlify pattern when ALLOWED_ORIGINS is set
  allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
} else if (process.env.NODE_ENV === 'production') {
  // Default production origins
  allowedOrigins = [
    'https://sensebait.pro', 
    'https://www.sensebait.pro',
    'https://beamish-granita-b7abb8.netlify.app' // Explicit Netlify subdomain
  ];
  // Allow all Netlify subdomains via regex pattern
  allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
} else {
  // Development
  allowedOrigins = ['http://localhost:3000'];
}

// CORS middleware - must be before routes
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log(`CORS: Checking origin: ${origin}`);
    console.log(`CORS: Allowed origins:`, allowedOrigins);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        const matches = origin === allowed;
        if (matches) console.log(`CORS: Matched string origin: ${allowed}`);
        return matches;
      } else if (allowed instanceof RegExp) {
        const matches = allowed.test(origin);
        if (matches) console.log(`CORS: Matched regex origin: ${allowed}`);
        return matches;
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`CORS: ✅ Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS: ❌ Blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
  preflightContinue: false // Let cors handle preflight
}));

// Rate limiting for auth routes (stricter for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // Increased to prevent false positives
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/me' // Skip rate limiting for /me endpoint (handled separately)
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
// CORS middleware is applied globally above, so these files will have proper CORS headers
// Try backend/public first (Railway), fallback to frontend/public (local dev)
const phishingExamplesPath = fs.existsSync(path.join(__dirname, 'public/phishing-examples'))
  ? path.join(__dirname, 'public/phishing-examples')
  : path.join(__dirname, '../frontend/public/phishing-examples');

const avatarsPath = fs.existsSync(path.join(__dirname, 'public/avatars'))
  ? path.join(__dirname, 'public/avatars')
  : path.join(__dirname, '../frontend/public/avatars');

app.use('/avatars', express.static(avatarsPath));
app.use('/phishing-examples', express.static(phishingExamplesPath, {
  setHeaders: (res, filePath) => {
    // Set long cache for images
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Routes
// Root endpoint - helpful info
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend API is running!',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth/*',
      modules: '/api/modules/*',
      sections: '/api/sections/*',
      learningContent: '/api/learning-content/*'
    },
    timestamp: new Date().toISOString()
  });
});

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
app.use('/api/maintenance', maintenanceRoutes);

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
    
    // Ensure phishing examples page exists on startup (always run in production)
    if (process.env.NODE_ENV === 'production') {
      console.log('Ensuring phishing examples page exists...');
      try {
        const ensureScriptPath = path.join(__dirname, 'scripts', 'ensure-phishing-examples-on-railway');
        const ensureFullPath = ensureScriptPath + '.js';
        
        if (fs.existsSync(ensureFullPath)) {
          // Import the function from the script
          const ensurePhishingExamples = require(ensureScriptPath);
          // Run asynchronously so it doesn't block server startup
          ensurePhishingExamples()
            .then(result => {
              if (result && result.success) {
                console.log(`✅ Phishing examples page ${result.action} on startup`);
              } else {
                console.log('✅ Phishing examples page ensured on startup');
              }
            })
            .catch(err => {
              console.error('⚠️  Failed to ensure phishing examples page (non-fatal):', err.message);
              // Don't crash the server if this fails
            });
        } else {
          console.warn('⚠️  Ensure phishing examples script not found');
        }
      } catch (err) {
        console.warn('⚠️  Error ensuring phishing examples page:', err.message);
      }
    }
    
    // Optional: Auto-update learning content on startup
    // Set AUTO_UPDATE_LEARNING_CONTENT=true in Railway environment variables to enable
    if (process.env.AUTO_UPDATE_LEARNING_CONTENT === 'true') {
      console.log('Auto-update enabled: Checking learning content...');
      try {
        // Use absolute path for better reliability across different environments
        const scriptPath = path.join(__dirname, 'scripts', 'auto-update-learning-content');
        const fullPath = scriptPath + '.js';
        
        // Check if file exists before requiring
        if (!fs.existsSync(fullPath)) {
          console.warn('⚠️  Auto-update script not found at:', fullPath);
          console.warn('   Current working directory:', process.cwd());
          console.warn('   __dirname:', __dirname);
          console.warn('   To enable auto-update, ensure the script exists at the expected path');
        } else {
          console.log('✅ Auto-update script found at:', fullPath);
          const { autoUpdate } = require(scriptPath);
          // Run asynchronously so it doesn't block server startup
          autoUpdate()
            .then(updated => {
              if (updated) {
                console.log('✅ Learning content auto-updated on startup');
              } else {
                console.log('ℹ️  Learning content is already up to date');
              }
            })
            .catch(err => {
              console.error('⚠️  Auto-update failed (non-fatal):', err.message);
              console.error('   Error stack:', err.stack);
              // Don't crash the server if auto-update fails
            });
        }
      } catch (requireError) {
        console.warn('⚠️  Auto-update script not found. Skipping auto-update.');
        console.warn('   Error:', requireError.message);
        console.warn('   Stack:', requireError.stack);
        console.warn('   Current working directory:', process.cwd());
        console.warn('   __dirname:', __dirname);
        // Don't crash the server if the script is missing
      }
    }
    
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
