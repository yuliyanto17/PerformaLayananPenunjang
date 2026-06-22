// src/api/layanan.api.js

/**
 * Layanan API Service
 */

import apiClient from './axios';
import endpoints from './endpoints';

export const layananApi = {
  /**
   * Get all layanan
   * @returns {Promise<Object>}
   */
  getAll: async () => {
    return await apiClient.get(endpoints.layanan.getAll);
  },
  
  /**
   * Get layanan by ID
   * @param {number} id - Layanan ID
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return await apiClient.get(endpoints.layanan.getById(id));
  },
  
  /**
   * Get layanan with statistics
   * @param {number} id - Layanan ID
   * @returns {Promise<Object>}
   */
  getWithStats: async (id) => {
    return await apiClient.get(endpoints.layanan.getWithStats(id));
  },
};

export default layananApi;