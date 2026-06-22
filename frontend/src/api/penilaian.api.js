// src/api/penilaian.api.js

/**
 * Penilaian API Service
 */

import apiClient from './axios';
import endpoints from './endpoints';

export const penilaianApi = {
  /**
   * Start new penilaian
   * @param {Object} data - Penilaian data
   * @returns {Promise<Object>}
   */
  start: async (data) => {
    return await apiClient.post(endpoints.penilaian.start, data);
  },
  
  /**
   * Save answer
   * @param {number} penilaianId - Penilaian ID
   * @param {Object} answerData - Answer data
   * @returns {Promise<Object>}
   */
  saveAnswer: async (penilaianId, answerData) => {
    return await apiClient.put(
      endpoints.penilaian.saveAnswer(penilaianId),
      answerData
    );
  },
  
  /**
   * Submit penilaian
   * @param {number} penilaianId - Penilaian ID
   * @param {Object} data - Additional data (komentar, saran)
   * @returns {Promise<Object>}
   */
  submit: async (penilaianId, data = {}) => {
    return await apiClient.post(
      endpoints.penilaian.submit(penilaianId),
      data
    );
  },
  
  /**
   * Get penilaian by ID
   * @param {number} penilaianId - Penilaian ID
   * @returns {Promise<Object>}
   */
  getById: async (penilaianId) => {
    return await apiClient.get(endpoints.penilaian.getById(penilaianId));
  },
};

export default penilaianApi;