// src/api/endpoints.js

/**
 * API Endpoints
 * Centralized endpoint definitions
 */

export const endpoints = {
  // Layanan
  layanan: {
    getAll: '/layanan',
    getById: (id) => `/layanan/${id}`,
    getWithStats: (id) => `/layanan/${id}/stats`,
  },
  
  // Petugas
  petugas: {
    getAll: '/petugas',
    getById: (id) => `/petugas/${id}`,
  },
  
  // Pasien
  pasien: {
    search: '/pasien/search',
    getByNoMR: (noMR) => `/pasien/mr/${noMR}`,
    checkAssessment: (noMR) => `/pasien/${noMR}/assessment-check`,
  },
  
  // Pertanyaan
  pertanyaan: {
    getByLayanan: (layananId) => `/pertanyaan/layanan/${layananId}`,
    getKategori: '/pertanyaan/kategori',
  },
  
  // Barcode
  barcode: {
    validate: '/barcode/validate',
    getQR: (token) => `/barcode/qr/${token}`,
  },
  
  // Penilaian
  penilaian: {
    start: '/penilaian/start',
    saveAnswer: (id) => `/penilaian/${id}/answer`,
    submit: (id) => `/penilaian/${id}/submit`,
    getById: (id) => `/penilaian/${id}`,
  },
};

export default endpoints;