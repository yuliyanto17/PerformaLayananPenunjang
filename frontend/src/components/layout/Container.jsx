// src/components/layout/Container.jsx

/**
 * ============================================
 * CONTAINER COMPONENT
 * ============================================
 * 
 * Responsive container untuk wrap content
 */

import React from 'react';

const Container = ({
  children,
  size = 'md',
  className = '',
  noPadding = false,
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };
  
  const paddingClasses = noPadding ? '' : 'px-4 sm:px-6 lg:px-8';
  
  return (
    <div className={`mx-auto w-full ${sizes[size]} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Container;