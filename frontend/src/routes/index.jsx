// src/routes/index.jsx

/**
 * ============================================
 * ROUTES CONFIGURATION
 * ============================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages
import HomePage from '../pages/home/HomePage';
import SelectLayananPage from '../pages/layanan/SelectLayananPage';
import SearchPasienPage from '../pages/pasien/SearchPasienPage';
import ScanBarcodePage from '../pages/barcode/ScanBarcodePage';
import FormPenilaianPage from '../pages/penilaian/FormPenilaianPage';
import ThankYouPage from '../pages/thankyou/ThankYouPage';
import QRGeneratorPage from '../pages/test/QRGeneratorPage';

// 404 Page
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
      <a href="/" className="btn btn-primary">
        Kembali ke Beranda
      </a>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />
        
        {/* Penilaian Flow */}
        <Route path="/layanan" element={<SelectLayananPage />} />
        <Route path="/pasien" element={<SearchPasienPage />} />
        <Route path="/barcode" element={<ScanBarcodePage />} />
        <Route path="/penilaian" element={<FormPenilaianPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
         {/* Add route */}
        <Route path="/qr-generator" element={<QRGeneratorPage />} />

        {/* 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;