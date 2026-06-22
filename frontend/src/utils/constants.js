// src/utils/constants.js

/**
 * ============================================
 * CONSTANTS
 * ============================================
 */

// Rating emoji mapping
export const RATING_EMOJI = {
  1: '😞',
  2: '😐',
  3: '😊',
  4: '😄',
  5: '🤩',
};

// Rating label mapping
export const RATING_LABEL = {
  1: 'Sangat Tidak Puas',
  2: 'Tidak Puas',
  3: 'Cukup Puas',
  4: 'Puas',
  5: 'Sangat Puas',
};

// Rating colors
export const RATING_COLORS = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#84cc16', // lime
  5: '#22c55e', // green
};

// Layanan icons mapping
export const LAYANAN_ICONS = {
  RAD: 'activity',
  IRM: 'folder-open',
  PATKLINIK: 'flask-conical',
  PATANATOMI: 'microscope',
  ADMISI: 'clipboard-check',
};

// Routes
export const ROUTES = {
  HOME: '/',
  SELECT_LAYANAN: '/layanan',
  SEARCH_PASIEN: '/pasien',
  SCAN_BARCODE: '/barcode',
  FORM_PENILAIAN: '/penilaian',
  THANK_YOU: '/thank-you',
};

// Storage keys
export const STORAGE_KEYS = {
  PENILAIAN: 'penilaian-storage',
  SESSION: 'session-id',
};

export default {
  RATING_EMOJI,
  RATING_LABEL,
  RATING_COLORS,
  LAYANAN_ICONS,
  ROUTES,
  STORAGE_KEYS,
};