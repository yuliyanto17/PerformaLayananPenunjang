// src/components/common/ErrorMessage.jsx

/**
 * ============================================
 * ERROR MESSAGE COMPONENT
 * ============================================
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({
  message,
  title = 'Terjadi Kesalahan',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-6 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{message}</p>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary mt-2"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;