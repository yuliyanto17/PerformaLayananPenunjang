// src/config/env.js

require('dotenv').config();

/**
 * Validasi required environment variables
 * Sekarang ada 2 set database configs
 */
const requiredEnvVars = [
  // Production DB
  'DB_PROD_USER',
  'DB_PROD_PASSWORD',
  'DB_PROD_SERVER',
  'DB_PROD_DATABASE',
  
  // Local DB
  'DB_LOCAL_USER',
  'DB_LOCAL_PASSWORD',
  'DB_LOCAL_SERVER',
  'DB_LOCAL_DATABASE',
  
  // App
  'PORT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  process.exit(1);
}

const config = {
  app: {
    name: process.env.APP_NAME || 'Performa Layanan API',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    timezone: process.env.TZ || 'Asia/Jakarta',
  },
  
  // Production Database (Read-Only)
  databaseProduction: {
    user: process.env.DB_PROD_USER,
    password: process.env.DB_PROD_PASSWORD,
    server: process.env.DB_PROD_SERVER,
    database: process.env.DB_PROD_DATABASE,
    port: parseInt(process.env.DB_PROD_PORT) || 1433,
  },
  
  // Local Database (Read/Write)
  databaseLocal: {
    user: process.env.DB_LOCAL_USER,
    password: process.env.DB_LOCAL_PASSWORD,
    server: process.env.DB_LOCAL_SERVER,
    database: process.env.DB_LOCAL_DATABASE,
    port: parseInt(process.env.DB_LOCAL_PORT) || 1433,
  },
  
  security: {
    corsOrigin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  upload: {
    path: process.env.UPLOAD_PATH || './src/uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5242880,
    qrCodePath: process.env.QR_CODE_PATH || './src/uploads/qrcodes',
    qrCodeSize: parseInt(process.env.QR_CODE_SIZE) || 300,
    qrCodeErrorCorrection: process.env.QR_CODE_ERROR_CORRECTION || 'M',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './src/logs',
  },
  
  isDevelopment: () => config.app.env === 'development',
  isProduction: () => config.app.env === 'production',
  isTest: () => config.app.env === 'test',
};

module.exports = config;