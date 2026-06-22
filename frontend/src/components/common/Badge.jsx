// src/components/common/Badge.jsx

/**
 * ============================================
 * BADGE COMPONENT
 * ============================================
 */

import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'badge';
  
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    gray: 'bg-gray-100 text-gray-700',
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;