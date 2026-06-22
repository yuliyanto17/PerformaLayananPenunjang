// src/App.jsx

/**
 * ============================================
 * MAIN APP COMPONENT
 * ============================================
 */

import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      {/* Routes */}
      <AppRoutes />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 20px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;