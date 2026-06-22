// src/components/forms/RatingInput.jsx

/**
 * ============================================
 * RATING INPUT COMPONENT
 * ============================================
 * 
 * Rating dengan emoji dan warna
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const RatingInput = ({
  value,
  onChange,
  maxRating = 5,
  labels = [],
  emojis = [],
  colors = [],
  showLabel = true,
  size = 'lg',
  disabled = false,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState(null);
  
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  };
  
  const handleClick = (rating) => {
    if (!disabled) {
      onChange(rating);
    }
  };
  
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        {/* Emoji Display */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: maxRating }, (_, index) => {
            const rating = index + 1;
            const isActive = rating <= displayValue;
            const emoji = emojis[rating - 1] || emojis[index];
            const color = colors[rating - 1] || colors[index];
            
            return (
              <motion.button
                key={rating}
                type="button"
                onClick={() => handleClick(rating)}
                onMouseEnter={() => !disabled && setHoverValue(rating)}
                onMouseLeave={() => !disabled && setHoverValue(null)}
                whileTap={!disabled ? { scale: 0.9 } : {}}
                whileHover={!disabled ? { scale: 1.1 } : {}}
                className={`
                  ${sizes[size]}
                  transition-all duration-200
                  ${isActive ? 'opacity-100' : 'opacity-30'}
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                  filter: isActive && color ? `drop-shadow(0 0 8px ${color})` : 'none',
                }}
                disabled={disabled}
              >
                {emoji}
              </motion.button>
            );
          })}
        </div>
        
        {/* Label */}
        {showLabel && displayValue && labels[displayValue - 1] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p
              className="text-lg font-semibold"
              style={{ color: colors[displayValue - 1] }}
            >
              {labels[displayValue - 1]}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RatingInput;