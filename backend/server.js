const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
// Load environment variables - try config.env first, then fall back to default .env behavior
// On Railway, environment variables are set directly, so this won't fail if file doesn't exist
try {
  require('dotenv').config({ path: './config.env' });
} catch (err) {
  // If config.env doesn't exist, try default .env file (for local development)
  require('dotenv').config();
}

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

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration - MUST BE BEFORE HELMET AND ALL OTHER MIDDLEWARE
// Explicitly allow both custom domain and Netlify subdomain
let allowedOrigins = [];

// Always include sensebait.pro domains regardless of environment
const sensebaitOrigins = ['https://sensebait.pro', 'https://www.sensebait.pro'];

// Detect production environment (Railway sets RAILWAY_ENVIRONMENT or PORT)
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.RAILWAY_ENVIRONMENT || 
                     (process.env.PORT && !process.env.NODE_ENV);

if (process.env.ALLOWED_ORIGINS) {
  // If ALLOWED_ORIGINS is set, use it and also add sensebait.pro and Netlify pattern
  try {
    allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);
    // Always ensure sensebait.pro domains are included
    sensebaitOrigins.forEach(origin => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    });
    // Always add Netlify pattern when ALLOWED_ORIGINS is set
    allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
  } catch (err) {
    console.error('Error parsing ALLOWED_ORIGINS, using defaults:', err.message);
    // Fall back to default production origins
    allowedOrigins = [...sensebaitOrigins, 'https://beamish-granita-b7abb8.netlify.app'];
    allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
  }
} else if (isProduction) {
  // Default production origins
  allowedOrigins = [
    ...sensebaitOrigins,
    'https://beamish-granita-b7abb8.netlify.app' // Explicit Netlify subdomain
  ];
  // Allow all Netlify subdomains via regex pattern
  allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
} else {
  // Development
  allowedOrigins = ['http://localhost:3000', ...sensebaitOrigins];
}

// Log allowed origins on startup for debugging
console.log('='.repeat(80));
console.log('CORS Configuration:');
console.log('  Allowed Origins:', allowedOrigins);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('  PORT:', process.env.PORT || 'not set');
console.log('  Detected Production:', isProduction);
console.log('='.repeat(80));

// CORS middleware - MUST BE FIRST (before Helmet and all other middleware)
// Configure CORS to handle both preflight and actual requests
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS allowed request from origin: ${origin}`);
      callback(null, true);
    } else {
      // Log CORS rejection for debugging
      console.log(`❌ CORS blocked request from origin: ${origin}`);
      console.log(`   Allowed origins:`, allowedOrigins);
      // Return false instead of error to let CORS send proper response
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Security middleware - configure Helmet to not interfere with CORS
// Must be AFTER CORS middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP to avoid conflicts with CORS
}));

// Rate limiting for auth routes (stricter for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 30 : 100, // Increased to prevent false positives
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests (preflight) and /me endpoint
    const isOptions = req.method === 'OPTIONS';
    const isMe = req.path === '/me' || req.path.endsWith('/me') || req.originalUrl.includes('/me');
    if (isOptions) {
      console.log('⏭️  Rate limiter skipping OPTIONS request');
    }
    return isOptions || isMe;
  }
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

// Error handling middleware - but don't interfere with CORS errors
app.use((err, req, res, next) => {
  // If this is a CORS error, let CORS middleware handle it
  if (err.message && err.message.includes('CORS')) {
    return next(err); // Pass to default CORS error handler
  }
  
  console.error('Error middleware caught:', err);
  console.error('Stack:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: (process.env.NODE_ENV === 'development' || !process.env.RAILWAY_ENVIRONMENT) ? err.message : 'Internal server error'
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
    
    try {
      await initDatabase();
      console.log('Database initialized successfully');
    } catch (dbError) {
      console.error('❌ CRITICAL: Database initialization failed:', dbError);
      console.error('Stack:', dbError.stack);
      throw dbError; // Re-throw to prevent server from starting with broken database
    }
    
    // Ensure phishing examples page exists on startup (always run in production)
    // Use same production detection logic as CORS config
    if (isProduction) {
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
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
      console.log('CORS Allowed Origins:', allowedOrigins);
      console.log('Routes registered:');
      console.log('  - /api/health');
      console.log('  - /api/test');
      console.log('  - /api/auth/*');
      console.log('  - /api/modules/*');
      console.log('  - /api/user/*');
      console.log('  - /api/sections/*');
      console.log('  - /api/support/*');
    }).on('error', (err) => {
      console.error('❌ CRITICAL: Failed to start server on port', PORT);
      console.error('Error:', err.message);
      console.error('Stack:', err.stack);
      if (err.code === 'EADDRINUSE') {
        console.error('Port', PORT, 'is already in use. Please check if another instance is running.');
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ CRITICAL: Failed to start server:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

startServer();
