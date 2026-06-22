// src/utils/logger.js

/**
 * ============================================
 * WINSTON LOGGER CONFIGURATION
 * ============================================
 * 
 * Winston = logging library yang powerful
 * Features:
 * - Multiple transports (console, file, database, dll)
 * - Log levels (error, warn, info, http, debug)
 * - Custom formatting
 * - Rotation logs (auto create new file setiap hari)
 */

const winston = require('winston');
const path = require('path');
const config = require('../config/env');

/**
 * Custom Log Format
 * 
 * Format yang akan digunakan untuk setiap log entry
 */
const logFormat = winston.format.combine(
  // Timestamp
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  
  // Include error stack trace
  winston.format.errors({ stack: true }),
  
  // Splat (untuk string interpolation)
  winston.format.splat(),
  
  // Custom printf format
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata jika ada
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace jika ada (untuk errors)
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * Create Winston Logger Instance
 */
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  
  // Transports = tempat output log
  transports: [
    // 1. Console Transport (untuk development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Warna di console
        logFormat
      ),
    }),
    
    // 2. File Transport - Error Log
    // Khusus untuk log level error
    new winston.transports.File({
      filename: path.join(config.logging.filePath, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep 5 files max
    }),
    
    // 3. File Transport - Combined Log
    // Semua log levels
    new winston.transports.File({
      filename: path.join(config.logging.filePath, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // 4. File Transport - HTTP Log
    // Khusus untuk HTTP requests
    new winston.transports.File({
      filename: path.join(config.logging.filePath, 'http.log'),
      level: 'http',
      maxsize: 5242880,
      maxFiles: 3,
    }),
  ],
  
  // Exception Handlers
  // Untuk catch uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logging.filePath, 'exceptions.log'),
    }),
  ],
  
  // Rejection Handlers
  // Untuk catch unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logging.filePath, 'rejections.log'),
    }),
  ],
});

/**
 * Helper Functions untuk logging
 */

// Log HTTP Request
logger.logRequest = (req, statusCode, responseTime) => {
  logger.http(`${req.method} ${req.path}`, {
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

// Log Database Query
logger.logQuery = (query, params, duration) => {
  logger.debug('Database Query', {
    query: query.substring(0, 200), // Limit query length
    params,
    duration: `${duration}ms`,
  });
};

// Log Business Event
logger.logEvent = (event, data) => {
  logger.info(`Event: ${event}`, data);
};

module.exports = logger;