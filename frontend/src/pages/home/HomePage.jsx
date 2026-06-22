// src/pages/home/HomePage.jsx

/**
 * ============================================
 * HOME PAGE
 * ============================================
 * 
 * Landing page dengan welcome screen
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';
import { generateSessionId } from '../../utils/helpers';
import { usePenilaianStore } from '../../store/usePenilaianStore';

const HomePage = () => {
  const navigate = useNavigate();
  const { reset, setSessionInfo } = usePenilaianStore();

  useEffect(() => {
    // Reset store saat masuk home page
    reset();

    // Generate session ID
    const sessionId = generateSessionId();
    setSessionInfo(sessionId, null);
  }, []);

  const handleStart = () => {
    navigate(ROUTES.SELECT_LAYANAN);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] p-8 border border-white/40"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            className="flex justify-center mx-auto mb-6"
          >
            <div className="relative w-24 h-24 p-2 rounded-2xl bg-white shadow-md border border-primary-50 flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-50 to-white opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src="/Logo-rsus.png"
                alt="Logo"
                className="w-full h-full object-contain relative z-10 drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Penilaian Performa
            </h1>
            <p className="text-primary-600 font-medium tracking-wide">
              Layanan Penunjang Rumah Sakit
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="bg-primary-100/100 rounded-2xl p-4 mb-6 border border-primary-100/50"
          >
            <p className="text-sm text-gray-700 text-center leading-relaxed">
              Kepuasan Anda adalah prioritas kami. Mohon luangkan waktu untuk memberikan penilaian terhadap layanan yang Anda terima.
            </p>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="space-y-4 mb-8"
          >
            {[
              "Pilih layanan yang Anda gunakan",
              "Cari data pasien Anda",
              "Scan barcode petugas penunjang",
              "Isi form penilaian dengan jujur"
            ].map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className="flex items-center gap-4 group"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 text-sm font-bold group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-700 font-medium">{text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Button
              onClick={handleStart}
              variant="primary"
              size="lg"
              className="w-full py-4 relative overflow-hidden rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 transition-all duration-300"
              icon={ArrowRight}
              iconPosition="right"
            >
              <span className="relative z-10 font-semibold tracking-wide">Mulai Penilaian</span>
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="text-center text-xs text-gray-400 mt-6 font-medium"
          >
            Estimasi waktu: <span className="text-gray-500">± 3-5 menit</span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;