// src/middleware/validator.js

/**
 * ============================================
 * VALIDATION MIDDLEWARE
 * ============================================
 * 
 * Middleware untuk validasi request menggunakan Joi schemas
 */

const ApiError = require('../utils/ApiError');

/**
 * Validate Request
 * 
 * @param {Object} schema - Joi schema object
 * @param {string} source - Source of data ('body', 'query', 'params')
 * @returns {Function} Express middleware
 * 
 * Usage:
 * router.post('/penilaian', 
 *   validate(startPenilaianSchema, 'body'),
 *   controller.create
 * );
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // Get data dari source yang ditentukan
    const data = req[source];
    
    // Validate menggunakan Joi schema
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return semua errors, bukan hanya yang pertama
      stripUnknown: true, // Remove fields yang tidak ada di schema
    });
    
    if (error) {
      // Format error messages
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));
      
      // Throw validation error
      throw new ApiError(400, 'Validation error', errors);
    }
    
    // Replace request data dengan validated value
    // Value sudah di-sanitize dan di-transform sesuai schema
    req[source] = value;
    
    next();
  };
};

/**
 * Validate Multiple Sources
 * 
 * Untuk validasi multiple sources sekaligus
 * 
 * Usage:
 * router.put('/penilaian/:id',
 *   validateMultiple({
 *     params: idParamSchema,
 *     body: updatePenilaianSchema
 *   }),
 *   controller.update
 * );
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate each source
    Object.keys(schemas).forEach(source => {
      const schema = schemas[source];
      const data = req[source];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        error.details.forEach(detail => {
          errors.push({
            source,
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          });
        });
      } else {
        // Update dengan validated value
        req[source] = value;
      }
    });
    
    if (errors.length > 0) {
      throw new ApiError(400, 'Validation error', errors);
    }
    
    next();
  };
};

/**
 * Sanitize Input
 * 
 * Middleware untuk sanitize user input
 * Mencegah XSS, SQL Injection, dll
 */
const sanitizeInput = (req, res, next) => {
  // Function untuk sanitize string
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove HTML tags
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<[^>]+>/g, '')
                .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj !== null && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    
    return obj;
  };
  
  // Sanitize body, query, params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

module.exports = {
  validate,
  validateMultiple,
  sanitizeInput,
};