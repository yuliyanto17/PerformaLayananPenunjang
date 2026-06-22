// src/config/config.js

/**
 * Application Configuration
 */

export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Performa Layanan Penunjang',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  features: {
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
};

export default config;