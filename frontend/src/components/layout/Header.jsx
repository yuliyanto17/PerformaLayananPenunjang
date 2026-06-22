// src/components/layout/Header.jsx

/**
 * ============================================
 * HEADER COMPONENT
 * ============================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Container from './Container';

const Header = ({
  title,
  subtitle,
  showBack = false,
  showHome = false,
  onBack,
  actions,
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  const handleHome = () => {
    navigate('/');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <Container>
        <div className="py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back/Home button */}
            <div className="flex items-center gap-3">
              {showBack && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </motion.button>
              )}
              
              {showHome && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleHome}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Home"
                >
                  <Home className="w-6 h-6 text-gray-700" />
                </motion.button>
              )}
              
              {/* Title */}
              <div>
                {title && (
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Right: Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;