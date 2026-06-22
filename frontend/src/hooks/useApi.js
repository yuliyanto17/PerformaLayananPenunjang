// src/hooks/useApi.js

/**
 * ============================================
 * useApi Hook
 * ============================================
 * 
 * Custom hook untuk handle API calls dengan:
 * - Loading state
 * - Error handling
 * - Success/Error callbacks
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFunction(...args);
        
        setData(response.data);
        return response;
        
      } catch (err) {
        const errorMessage = err.message || 'Terjadi kesalahan';
        setError(errorMessage);
        
        // Show toast notification
        toast.error(errorMessage);
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

export default useApi;