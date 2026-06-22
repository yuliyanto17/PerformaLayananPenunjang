// src/middleware/security.js

/**
 * ============================================
 * SECURITY MIDDLEWARE
 * ============================================
 * 
 * Setup security middleware:
 * - Helmet (secure HTTP headers)
 * - CORS (Cross-Origin Resource Sharing)
 * - Rate Limiting (anti brute force/spam)
 */

const helmet = require('helmet');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../config/env');

/**
 * Helmet Configuration
 * 
 * Helmet sets various HTTP headers untuk protect dari:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - dll
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  
  // X-Frame-Options (prevent clickjacking)
  frameguard: {
    action: 'deny',
  },
  
  // Strict-Transport-Security (force HTTPS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Content-Type-Options (prevent MIME sniffing)
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
});

/**
 * CORS Configuration
 * 
 * Allow frontend untuk akses API
 */
const corsConfig = cors({
  // Origin yang diizinkan
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, postman, dll)
    if (!origin) return callback(null, true);
    console.log("CORS request origin:", origin);

    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    
    // production: strict whitelist
    if (config.security.corsOrigin.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  
  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Session-ID',
  ],
  
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Session-ID"],
  exposedHeaders: ["X-Response-Time", "X-Request-ID"],
  credentials: true,
  
  // Preflight cache duration (seconds)
  maxAge: 86400, // 24 hours
});

/**
 * Rate Limiter - General
 * 
 * Limit requests dari single IP
 * Mencegah brute force attack
 */
const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs, // 15 minutes default
  max: config.security.rateLimitMaxRequests, // 100 requests per windowMs
  
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429,
  },
  
  // Skip successful requests
  skipSuccessfulRequests: false,
  
  // Skip failed requests
  skipFailedRequests: false,
  
  // Standard headers
  standardHeaders: true,
  legacyHeaders: false,
  
  // Custom key generator (default: IP address)
  keyGenerator: (req) => {
        return ipKeyGenerator(req.ip);
    },
  
  // Handler saat limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      statusCode: 429,
      retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
    });
  },
});

/**
 * Rate Limiter - Strict (untuk sensitive endpoints)
 * 
 * Limit lebih ketat untuk endpoints sensitive:
 * - Login
 * - Submit penilaian
 * - Generate barcode
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
    statusCode: 429,
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * IP Whitelist Middleware (Optional)
 * 
 * Hanya izinkan request dari IP tertentu
 * Berguna untuk admin endpoints
 */
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip;
    
    if (allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied: IP not whitelisted',
        statusCode: 403,
      });
    }
  };
};

/**
 * Request ID Middleware
 * 
 * Generate unique ID untuk setiap request
 * Berguna untuk tracking dan debugging
 */
const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
  // Generate atau ambil dari header
  const id = req.get('X-Request-ID') || uuidv4();
  
  // Set ke request object
  req.id = id;
  
  // Set ke response header
  res.setHeader('X-Request-ID', id);
  
  next();
};

module.exports = {
  helmetConfig,
  corsConfig,
  generalLimiter,
  strictLimiter,
  ipWhitelist,
  requestId,
};