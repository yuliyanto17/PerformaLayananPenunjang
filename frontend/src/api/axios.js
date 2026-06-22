// src/api/axios.js

/**
 * Axios Instance Configuration
 * 
 * Centralized HTTP client dengan:
 * - Base URL configuration
 * - Request/Response interceptors
 * - Error handling
 */

import axios from 'axios';
import config from '../config/config';

// Create axios instance
const apiClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log('🚀 Request:', config.method.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('✅ Response:', response.config.url, response.data);
    }
    
    // Return data directly
    return response.data;
  },
  (error) => {
    // Handle errors
    console.error('❌ Response Error:', error);
    
    let errorMessage = 'Terjadi kesalahan';
    
    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || errorMessage;
      
      // Handle specific status codes
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Data tidak valid';
          break;
        case 404:
          errorMessage = 'Data tidak ditemukan';
          break;
        case 409:
          errorMessage = error.response.data?.message || 'Data sudah ada';
          break;
        case 500:
          errorMessage = 'Terjadi kesalahan pada server';
          break;
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Tidak dapat terhubung ke server';
    }
    
    // Return formatted error
    return Promise.reject({
      message: errorMessage,
      errors: error.response?.data?.errors,
      statusCode: error.response?.status,
    });
  }
);

export default apiClient;