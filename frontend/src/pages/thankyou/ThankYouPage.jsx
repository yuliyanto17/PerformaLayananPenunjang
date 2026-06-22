// src/pages/thankyou/ThankYouPage.jsx

/**
 * ============================================
 * THANK YOU PAGE
 * ============================================
 * 
 * Halaman terima kasih setelah submit penilaian
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, Home, RefreshCw } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { usePenilaianStore } from '../../store/usePenilaianStore';
import { ROUTES } from '../../utils/constants';
import confetti from 'canvas-confetti';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { getSummary, reset } = usePenilaianStore();
  const [summary, setSummary] = useState(null);
  
  useEffect(() => {
    // Get summary before reset
    const data = getSummary();
    setSummary(data);
    
    // Trigger confetti
    triggerConfetti();
    
    // Don't reset immediately, let user see the summary
  }, []);
  
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };
    
    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    
    fire(0.2, {
      spread: 60,
    });
    
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };
  
  const handleBackHome = () => {
    reset();
    navigate(ROUTES.HOME);
  };
  
  const handleNewAssessment = () => {
    reset();
    navigate(ROUTES.SELECT_LAYANAN);
  };
  
  return (
    <MainLayout
      header={{
        title: 'Terima Kasih',
        showHome: false,
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          className="flex justify-center mb-6"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
        </motion.div>
        
        {/* Thank You Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              🎉 Terima Kasih!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Penilaian Anda sangat berarti untuk meningkatkan kualitas layanan kami
            </p>
            
            {/* Penilaian Info */}
            {summary && (
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <p className="text-gray-600 mb-1">No. Penilaian</p>
                    <p className="font-semibold text-gray-900">
                      {summary.penilaianNo}
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <p className="text-gray-600 mb-1">Layanan</p>
                    <p className="font-semibold text-gray-900">
                      {summary.layanan?.layanan_name}
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <p className="text-gray-600 mb-1">Pasien</p>
                    <p className="font-semibold text-gray-900">
                      {summary.pasien?.Nama_Pasien}
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <p className="text-gray-600 mb-1">Petugas</p>
                    <p className="font-semibold text-gray-900">
                      {summary.petugas?.nama_petugas}
                    </p>
                  </div>
                </div>
                
                {/* Progress Summary */}
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {summary.answeredCount} dari {summary.totalQuestions} pertanyaan dijawab
                    </span>
                  </div>
                  
                  {summary.isComplete && (
                    <Badge variant="success" className="mt-2">
                      ✓ Semua pertanyaan wajib terjawab
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Quote */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 italic">
                "Kepuasan pasien adalah komitmen kami. Setiap masukan Anda membantu kami menjadi lebih baik."
              </p>
              <p className="text-sm text-gray-600 mt-2">
                - Tim Rumah Sakit
              </p>
            </div>
            
            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleBackHome}
                variant="secondary"
                icon={Home}
                size="lg"
              >
                Kembali ke Beranda
              </Button>
              
              <Button
                onClick={handleNewAssessment}
                variant="primary"
                icon={RefreshCw}
                size="lg"
              >
                Penilaian Baru
              </Button>
            </div>
          </Card>
        </motion.div>
        
        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="bg-blue-50 border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-800">
                <strong>💡 Tahukah Anda?</strong>
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Penilaian Anda akan digunakan untuk evaluasi dan peningkatan kualitas layanan.
                Data Anda akan dijaga kerahasiaannya.
              </p>
            </div>
          </Card>
        </motion.div>
        
        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-gray-500 mt-6"
        >
          Semoga lekas sembuh dan sehat selalu! 🙏
        </motion.p>
      </div>
    </MainLayout>
  );
};

export default ThankYouPage;