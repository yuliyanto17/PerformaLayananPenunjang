// src/api/pasien.api.js

/**
 * Pasien API Service
 */

import apiClient from './axios';
import endpoints from './endpoints';

export const pasienApi = {
  /**
   * Search pasien
   * @param {string} keyword - Search keyword
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>}
   */
  search: async (keyword, filters = {}) => {
    return await apiClient.get(endpoints.pasien.search, {
      params: {
        q: keyword,
        ...filters,
      },
    });
  },
  
  /**
   * Get pasien by No MR
   * @param {string} noMR - Nomor Medical Record
   * @returns {Promise<Object>}
   */
  getByNoMR: async (noMR) => {
    return await apiClient.get(endpoints.pasien.getByNoMR(noMR));
  },
  
  /**
   * Check if pasien has been assessed
   * @param {string} noMR - Nomor Medical Record
   * @param {number} layananId - Layanan ID
   * @returns {Promise<Object>}
   */
  checkAssessment: async (noMR, layananId) => {
    return await apiClient.get(endpoints.pasien.checkAssessment(noMR), {
      params: { layanan_id: layananId },
    });
  },
};

export default pasienApi;