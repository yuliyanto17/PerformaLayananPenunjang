// src/api/pertanyaan.api.js

/**
 * Pertanyaan API Service
 */

import apiClient from './axios';
import endpoints from './endpoints';

export const pertanyaanApi = {
  /**
   * Get pertanyaan by layanan
   * @param {number} layananId - Layanan ID
   * @returns {Promise<Object>}
   */
  getByLayanan: async (layananId) => {
    return await apiClient.get(endpoints.pertanyaan.getByLayanan(layananId));
  },
  
  /**
   * Get kategori pertanyaan
   * @returns {Promise<Object>}
   */
  getKategori: async () => {
    return await apiClient.get(endpoints.pertanyaan.getKategori);
  },
};

export default pertanyaanApi;