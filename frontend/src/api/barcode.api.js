// src/api/barcode.api.js

/**
 * Barcode API Service
 */

import apiClient from './axios';
import endpoints from './endpoints';

export const barcodeApi = {
  /**
   * Validate barcode token
   * @param {string} token - Barcode token
   * @param {Object} context - Additional context
   * @returns {Promise<Object>}
   */
  validate: async (token, context = {}) => {
    return await apiClient.post(endpoints.barcode.validate, {
      barcode_token: token,
      ...context,
    });
  },
  
  /**
   * Get QR code as base64
   * @param {string} token - Barcode token
   * @returns {Promise<Object>}
   */
  getQR: async (token) => {
    return await apiClient.get(endpoints.barcode.getQR(token));
  },
};

export default barcodeApi;