// src/middleware/httpLogger.js

/**
 * ============================================
 * HTTP LOGGER MIDDLEWARE
 * ============================================
 * 
 * Menggunakan Morgan untuk log HTTP requests
 * Morgan = middleware untuk log HTTP requests
 */

const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Custom Morgan Token untuk response time
 */
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

/**
 * Custom Morgan Format
 * 
 * Format: :method :url :status :response-time-ms - :remote-addr
 */
const morganFormat = ':method :url :status :response-time ms - :remote-addr';

/**
 * Stream untuk Winston
 * Morgan akan write ke stream ini,
 * yang kemudian akan diterima Winston
 */
const stream = {
  write: (message) => {
    // Remove newline dari morgan
    logger.http(message.trim());
  },
};

/**
 * Morgan Middleware Instance
 */
const httpLogger = morgan(morganFormat, {
  stream,
  // Skip logging untuk static files (optional)
  skip: (req, res) => {
    // Skip jika request ke static assets
    return req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/);
  },
});

/**
 * Response Time Middleware
 * 
 * Menghitung waktu yang dibutuhkan untuk process request
 */
const responseTime = (req, res, next) => {
  const startTime = Date.now();
  
  // Hook ke finish event (saat response dikirim)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // res.setHeader('X-Response-Time', duration);
    
    // Log request dengan winston
    logger.logRequest(req, res.statusCode, duration);
  });
  
  next();
};

module.exports = {
  httpLogger,
  responseTime,
};