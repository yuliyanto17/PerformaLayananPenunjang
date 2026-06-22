// src/components/common/Card.jsx

/**
 * ============================================
 * CARD COMPONENT
 * ============================================
 */

import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  padding = true,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-md';
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';
  const paddingClasses = padding ? 'p-6' : '';
  
  const Component = onClick ? motion.div : 'div';
  
  return (
    <Component
      className={`${baseClasses} ${hoverClasses} ${paddingClasses} ${className}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;