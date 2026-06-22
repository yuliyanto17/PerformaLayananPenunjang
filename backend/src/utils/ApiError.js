// src/utils/ApiError.js

/**
 * ============================================
 * CUSTOM API ERROR CLASS
 * ============================================
 * 
 * Extends Error class untuk custom error handling
 * Memudahkan throw error dengan status code dan message
 * 
 * Usage:
 * throw new ApiError(404, 'Data not found');
 * throw new ApiError(400, 'Invalid input', errors);
 */

class ApiError extends Error {
  /**
   * Constructor
   * 
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {array|object} errors - Validation errors (optional)
   * @param {boolean} isOperational - Is this an operational error? (default: true)
   * 
   * Operational error = error yang kita expect (user input salah, data tidak ada, dll)
   * Programming error = bug dalam code (null reference, dll)
   */
  constructor(statusCode, message, errors = null, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    
    // Capture stack trace
    // Berguna untuk debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;