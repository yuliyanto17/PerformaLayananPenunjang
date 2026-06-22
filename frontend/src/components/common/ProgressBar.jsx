// src/components/common/ProgressBar.jsx

/**
 * ============================================
 * PROGRESS BAR COMPONENT
 * ============================================
 */

import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({
  progress = 0,
  showLabel = true,
  height = 'h-2',
  color = 'bg-primary-600',
  className = '',
}) => {
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-semibold text-primary-600">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <motion.div
          className={`${height} ${color} rounded-full`}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;