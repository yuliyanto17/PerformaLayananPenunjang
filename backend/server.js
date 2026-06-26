// server.js

/**
 * ============================================
 * MAIN SERVER FILE
 * ============================================
 */

require('dotenv').config();
const express = require('express');
const config = require('./src/config/env');
const db = require('./src/config/database');
const logger = require('./src/utils/logger');

// Middleware imports
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { httpLogger, responseTime } = require('./src/middleware/httpLogger');
const { sanitizeInput } = require('./src/middleware/validator');
const {
  helmetConfig,
  corsConfig,
  generalLimiter,
  requestId,
} = require('./src/middleware/security');

// Routes import
const routes = require('./src/routes');

// Initialize express app
const app = express();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// 1. Security Headers
app.use(helmetConfig);

// 2. CORS
app.use(corsConfig);

// 3. Request ID
app.use(requestId);

// 4. Response Time Tracker
app.use(responseTime);

// 5. HTTP Logger (Morgan + Winston)
app.use(httpLogger);

// 6. Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Input Sanitization
app.use(sanitizeInput);

// 8. Rate Limiting (general)
app.use('/api', generalLimiter);

// ============================================
// STATIC FILES
// ============================================

// Serve uploaded files (QR codes, photos)
app.use('/uploads', express.static('src/uploads'));

// ============================================
// ROUTES
// ============================================

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.env,
    version: config.app.version,
  });
});

// API v1 Routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Performa Layanan Penunjang API',
    version: config.app.version,
    documentation: '/api/v1',
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler (harus setelah semua routes)
app.use(notFoundHandler);

// Error Handler (harus paling terakhir)
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const PORT = config.app.port;

const startServer = async () => {
  try {
    // Test database connections
    logger.info('Testing database connections...');
    const dbStatus = await db.testConnections();

    if (!dbStatus.production || !dbStatus.local) {
      logger.error('Database connection failed');
      process.exit(1);
    }

    // Start HTTP server (SSL terminated by Nginx)
    app.listen(PORT, '127.0.0.1', () => {
      logger.info('═══════════════════════════════════════════');
      logger.info(`🚀 Server started successfully`);
      logger.info(`📦 App Name: ${config.app.name}`);
      logger.info(`🔢 Version: ${config.app.version}`);
      logger.info(`🌍 Environment: ${config.app.env}`);
      logger.info(`🔗 URL: http://127.0.0.1:${PORT} (internal)`);
      logger.info(`🔗 Public: https://192.168.200.155:5000 (via Nginx)`);
      logger.info(`🕐 Started at: ${new Date().toISOString()}`);
      logger.info('═══════════════════════════════════════════');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.closeAllPools();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await db.closeAllPools();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;