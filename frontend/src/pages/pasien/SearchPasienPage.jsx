// src/pages/pasien/SearchPasienPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Search as SearchIcon,
  X,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { usePenilaianStore } from '../../store/usePenilaianStore';
import axios from 'axios';

const SearchPasienPage = () => {
  const navigate = useNavigate();
  const { selectedLayanan, setPasien } = usePenilaianStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [pasienList, setPasienList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Redirect if no layanan selected
  useEffect(() => {
    if (!selectedLayanan) {
      navigate('/layanan');
    }
  }, [selectedLayanan, navigate]);
  
  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const timer = setTimeout(() => {
        searchPasien(searchTerm);
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    } else {
      setPasienList([]);
      setSearched(false);
    }
  }, [searchTerm]);
  
  const searchPasien = async (keyword) => {
    try {
      setLoading(true);
      setSearched(true);
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      console.log('📡 Searching pasien:', keyword);
      
      const response = await axios.get(`${apiUrl}/pasien/search`, {
        params: { q: keyword }
      });
      
      console.log('✅ Search response:', response);
      console.log('✅ Response.data:', response.data);
      console.log('✅ Response.data.data:', response.data.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        console.log('✅ Setting pasien list:', response.data.data.length, 'items');
        setPasienList(response.data.data);
      } else {
        console.warn('⚠️ Unexpected response format');
        setPasienList([]);
      }
      
    } catch (err) {
      console.error('❌ Search error:', err);
      setPasienList([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectPasien = async (pasien) => {
    try {
      console.log('✅ Selected pasien:', pasien);
      
      // Optional: Check if already assessed
      // For now, just proceed
      
      setPasien(pasien);
      navigate('/barcode');
      
    } catch (error) {
      console.error('Error:', error);
      // Continue anyway
      setPasien(pasien);
      navigate('/barcode');
    }
  };
  
  const handleClear = () => {
    setSearchTerm('');
    setPasienList([]);
    setSearched(false);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  // console.log('🎨 Render state:', {
  //   searchTerm,
  //   loading,
  //   searched,
  //   pasienCount: pasienList.length
  // });
  
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
              <h1 className="text-xl font-bold text-gray-900">Cari Data Pasien</h1>
              <p className="text-sm text-gray-600">{selectedLayanan?.layanan_name}</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No. MR atau Nama Pasien (min 3 karakter)..."
              className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            
            {searchTerm && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            💡 Ketik minimal 3 karakter untuk mulai mencari
          </p>
        </div>
        
        {/* Results */}
        <div className="space-y-3">
          {/* Loading State */}
          {loading && searchTerm.length >= 3 && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Mencari data pasien...</p>
            </div>
          )}
          
          {/* Empty State - Before Search */}
          {!loading && !searched && searchTerm.length < 3 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mulai Pencarian</h3>
              <p className="text-gray-600">Ketik No. MR atau Nama Pasien untuk mencari data</p>
            </div>
          )}
          
          {/* No Results */}
          {!loading && searched && pasienList.length === 0 && searchTerm.length >= 3 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada data ditemukan
              </h3>
              <p className="text-gray-600">
                Tidak ada pasien dengan kata kunci "{searchTerm}"
              </p>
            </div>
          )}
          
          {/* Results List */}
          {!loading && pasienList.length > 0 && (
            <AnimatePresence>
              {pasienList.map((pasien, index) => (
                <motion.div
                  key={pasien.No_Reg || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    onClick={() => handleSelectPasien(pasien)}
                    className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-all active:scale-98"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        {/* Name & Gender */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pasien.Nama_Pasien}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {pasien.Jenis_Kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </div>
                        
                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {/* No MR */}
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span>No. MR: <strong className="text-gray-900">{pasien.No_MR}</strong></span>
                          </div>
                          
                          {/* No Reg */}
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span>No. Reg: <strong className="text-gray-900">{pasien.No_Reg}</strong></span>
                          </div>
                          
                          {/* Tanggal */}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(pasien.Tgl_Masuk)}</span>
                          </div>
                          
                          {/* Medis */}
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              {pasien.Medis}
                            </span>
                          </div>
                        </div>
                        
                        {/* Rekanan */}
                        {pasien.NamaRekanan && (
                          <div className="text-sm text-gray-600">
                            Penjamin: <span className="font-medium">{pasien.NamaRekanan}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-primary-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Helper */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Perhatian:</p>
              <p>Pastikan data pasien yang dipilih sudah benar sebelum melanjutkan.</p>
            </div>
          </div>
        </div>
        
        {/* Debug Info (development only) */}
        {/* {import.meta.env.DEV && (
          <div className="mt-4 bg-gray-800 text-white rounded-lg p-4 text-xs font-mono">
            <div className="mb-2 font-bold text-green-400">🐛 Debug Info:</div>
            <div className="space-y-1">
              <div>Search Term: "{searchTerm}"</div>
              <div>Search Term Length: {searchTerm.length}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Searched: {searched.toString()}</div>
              <div>Pasien Count: {pasienList.length}</div>
              {pasienList.length > 0 && (
                <div>First Pasien: {pasienList[0]?.Nama_Pasien}</div>
              )}
            </div>
          </div>
        )} */}
      </main>
    </div>
  );
};

export default SearchPasienPage;