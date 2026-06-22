// src/utils/helpers.js

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format date
 */
export const formatDate = (date, formatStr = 'dd MMMM yyyy') => {
  if (!date) return '-';
  return format(new Date(date), formatStr, { locale: id });
};

/**
 * Format time
 */
export const formatTime = (date, formatStr = 'HH:mm') => {
  if (!date) return '-';
  return format(new Date(date), formatStr);
};

/**
 * Format datetime
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: id });
};

/**
 * Generate session ID
 */
export const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format duration (seconds to readable)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0 detik';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes} menit ${secs} detik`;
  }
  return `${secs} detik`;
};

/**
 * Truncate text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get rating color
 */
export const getRatingColor = (rating) => {
  const colors = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-lime-500',
    5: 'bg-green-500',
  };
  return colors[rating] || 'bg-gray-500';
};

/**
 * Get kategori kepuasan badge color
 */
export const getKepuasanBadgeColor = (kategori) => {
  const colors = {
    'Sangat Puas': 'badge-success',
    'Puas': 'badge-primary',
    'Cukup Puas': 'badge-warning',
    'Tidak Puas': 'badge-danger',
    'Sangat Tidak Puas': 'badge-danger',
  };
  return colors[kategori] || 'badge-primary';
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (current, total) => {
  if (!total) return 0;
  return Math.round((current / total) * 100);
};

/**
 * Sleep/delay function
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Check if mobile device
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Validate No MR (example)
 */
export const isValidNoMR = (noMR) => {
  if (!noMR) return false;
  // Simple validation: minimal 3 karakter
  return noMR.length >= 3;
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  generateSessionId,
  formatDuration,
  truncate,
  capitalize,
  getRatingColor,
  getKepuasanBadgeColor,
  calculateProgress,
  sleep,
  copyToClipboard,
  isMobile,
  isValidNoMR,
};