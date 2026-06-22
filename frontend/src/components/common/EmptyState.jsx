// src/components/common/EmptyState.jsx

/**
 * ============================================
 * EMPTY STATE COMPONENT
 * ============================================
 */

import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Tidak ada data',
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {description && (
          <p className="text-gray-600 text-sm">{description}</p>
        )}
      </div>
      
      {action && (
        <div className="mt-2">{action}</div>
      )}
    </div>
  );
};

export default EmptyState;