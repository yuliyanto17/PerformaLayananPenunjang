// src/pages/layanan/SelectLayananPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  FolderOpen,
  FlaskConical,
  Microscope,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { usePenilaianStore } from '../../store/usePenilaianStore';
import axios from 'axios';

const LAYANAN_ICONS = {
  RAD: Activity,
  IRM: FolderOpen,
  PATKLINIK: FlaskConical,
  PATANATOMI: Microscope,
  ADMISI: ClipboardCheck,
};

const SelectLayananPage = () => {
  const navigate = useNavigate();
  const { setLayanan, reset } = usePenilaianStore();
  
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadLayanan();
  }, []);
  
  const loadLayanan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      // console.log('📡 Calling API:', `${apiUrl}/layanan`);
      
      const response = await axios.get(`${apiUrl}/layanan`);
      
      // console.log('✅ Full Response:', response);
      // console.log('✅ Response.data:', response.data);
      // console.log('✅ Response.data.data:', response.data.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        console.log('✅ Setting layanan list:', response.data.data);
        setLayananList(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('✅ Setting layanan list (direct array):', response.data);
        setLayananList(response.data);
      } else {
        console.error('❌ Unexpected response format');
        setError('Format data tidak sesuai');
      }
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectLayanan = (layanan) => {
    // Clear all previous penilaian state so stale answers/penilaianId don't carry over
    reset();
    setLayanan(layanan);
    navigate('/pasien');
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data layanan...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadLayanan}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!layananList || layananList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Layanan</h3>
          <p className="text-gray-600 mb-4">Belum ada data layanan tersedia</p>
          <button
            onClick={loadLayanan}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  // Success - Render layanan list
  // console.log('🎨 Rendering', layananList.length, 'layanan');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pilih Layanan</h1>
              <p className="text-sm text-gray-600">Pilih layanan penunjang yang Anda gunakan</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {layananList.map((layanan, index) => {
            const Icon = LAYANAN_ICONS[layanan.layanan_code] || Activity;
            
            return (
              <motion.div
                key={layanan.layanan_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  onClick={() => handleSelectLayanan(layanan)}
                  className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-all active:scale-98"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${layanan.color_hex}20` }}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: layanan.color_hex }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {layanan.layanan_name}
                      </h3>
                      {layanan.deskripsi && (
                        <p className="text-sm text-gray-600">
                          {layanan.deskripsi}
                        </p>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Helper Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tips:</strong> Pilih layanan sesuai dengan pemeriksaan yang Anda jalani hari ini.
          </p>
        </div>
        
        {/* Debug Info (development only) */}
        {/* {import.meta.env.DEV && (
          <div className="mt-4 bg-gray-800 text-white rounded-lg p-4 text-xs font-mono">
            <div className="mb-2 font-bold text-green-400">🐛 Debug Info:</div>
            <div className="space-y-1">
              <div>API URL: {import.meta.env.VITE_API_BASE_URL}</div>
              <div>Layanan Count: {layananList.length}</div>
              <div>First Item: {layananList[0]?.layanan_name}</div>
            </div>
          </div>
        )} */}
      </main>
    </div>
  );
};

export default SelectLayananPage;