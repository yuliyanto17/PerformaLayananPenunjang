// src/components/forms/SearchInput.jsx

/**
 * ============================================
 * SEARCH INPUT COMPONENT
 * ============================================
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Cari...',
  loading = false,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-11 pr-10"
      />
      
      {value && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          type="button"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </motion.button>
      )}
      
      {loading && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
};

export default SearchInput;