// src/middleware/errorHandler.js

/**
 * ============================================
 * ERROR HANDLER MIDDLEWARE
 * ============================================
 * 
 * Centralized error handling untuk semua routes
 * Middleware ini akan catch semua error yang di-throw
 * dan mengirim response dengan format yang konsisten
 */

const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Convert error to ApiError
 * Untuk error yang bukan instance ApiError
 */
const convertToApiError = (err) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;
  
  // SQL Server Errors
  if (err.name === 'RequestError') {
    // Error dari mssql package
    statusCode = 400;
    message = 'Database query error';
    
    // Specific SQL errors
    if (err.number === 2627 || err.number === 2601) {
      // Duplicate key
      statusCode = 409;
      message = 'Data already exists';
    } else if (err.number === 547) {
      // Foreign key violation
      statusCode = 400;
      message = 'Cannot delete data: referenced by other records';
    } else if (err.number === 8152) {
      // String truncation
      statusCode = 400;
      message = 'Data too long for field';
    }
  }
  
  // Validation Errors (dari express-validator atau Joi)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = err.details || err.errors;
  }
  
  // JWT Errors (untuk nanti kalau pakai authentication)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  return new ApiError(statusCode, message, errors);
};

/**
 * Main Error Handler Middleware
 * 
 * Signature: (err, req, res, next)
 * Middleware dengan 4 parameter = error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  console.error('ORIGINAL ERROR:', err);
  console.error('ORIGINAL STACK:', err.stack);
  // Convert ke ApiError jika belum
  if (!(error instanceof ApiError)) {
    error = convertToApiError(err);
  }
  
  const { statusCode, message, errors } = error;
  
  // Log error
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ ERROR CAUGHT BY ERROR HANDLER');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Status Code:', statusCode);
  console.error('Message:', message);
  console.error('Path:', req.method, req.path);
  console.error('IP:', req.ip);
  console.error('User Agent:', req.get('user-agent'));
  
  if (errors) {
    console.error('Validation Errors:', JSON.stringify(errors, null, 2));
  }
  
  // Log stack trace in development
  if (config.isDevelopment()) {
    console.error('Stack Trace:', error.stack);
  }
  
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Prepare response
  const response = {
    success: false,
    message: err.message || message,
    statusCode,
  };
  
  // Include errors jika ada (validation errors)
  if (errors) {
    response.errors = errors;
  }
  
  // Include stack trace in development mode
  if (config.isDevelopment() && error.stack) {
    response.stack = error.stack;
  }
  
  // Send response
  res.status(statusCode).json(response);
};

/**
 * Not Found Handler
 * Untuk route yang tidak ada
 * 
 * Letakkan setelah semua routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route ${req.method} ${req.path} not found`
  );
  next(error);
};

/**
 * Async Handler Wrapper
 * 
 * Untuk wrap async function di routes
 * Otomatis catch error dan pass ke error handler
 * 
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDB();
 *   res.json(users);
 * }));
 * 
 * Tanpa asyncHandler, harus manual try-catch di setiap route
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ApiError,
};