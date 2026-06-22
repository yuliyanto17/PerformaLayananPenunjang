// src/components/forms/TextArea.jsx

import React from 'react';

const TextArea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  maxLength,
  required = false,
  disabled = false,
  showCount = false,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
          text-gray-900 placeholder-gray-400
          shadow-sm transition-all duration-300 ease-in-out
          focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none
          hover:border-primary-300 resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed hover:border-gray-200' : ''}
        `}
        {...props}
      />

      <div className="flex justify-between items-center mt-2 transition-all duration-300">
        <div className="flex-1">
          {error && (
            <p className="text-sm text-red-600 animate-fade-in">{error}</p>
          )}
        </div>

        {showCount && maxLength && (
          <p className={`text-xs ml-auto transition-colors duration-300 ${value?.length >= maxLength ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {value?.length || 0} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextArea;