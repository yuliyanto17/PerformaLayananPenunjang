// src/components/layout/MainLayout.jsx

/**
 * ============================================
 * MAIN LAYOUT COMPONENT
 * ============================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Container from './Container';

const MainLayout = ({
  children,
  header,
  containerSize = 'md',
  noPadding = false,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {header && <Header {...header} />}
      
      {/* Main Content */}
      <main className={`py-6 ${className}`}>
        <Container size={containerSize} noPadding={noPadding}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </Container>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <Container>
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Performa Layanan Penunjang - Rumah Sakit
          </p>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout;