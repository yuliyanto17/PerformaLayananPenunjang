// src/components/common/Button.jsx

/**
 * ============================================
 * BUTTON COMPONENT
 * ============================================
 * 
 * Reusable button dengan berbagai variant
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  // Base classes
  const baseClasses = 'btn inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant classes
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'hover:bg-gray-100',
  };
  
  // Size classes
  const sizes = {
    sm: 'btn-sm',
    md: 'px-4 py-2',
    lg: 'btn-lg',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-5 h-5" />
      )}
      
      <span>{children}</span>
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-5 h-5" />
      )}
    </button>
  );
};

export default Button;