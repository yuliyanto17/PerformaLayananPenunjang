import React, { useEffect, useState, useRef } from "react";
import { adminApi } from "../api/adminApi";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KioskFullscreenPage() {
  const navigate = useNavigate();
  const [petugas, setPetugas] = useState([]);
  const [qrCache, setQrCache] = useState({});

  const load = async () => {
    try {
      const resp = await adminApi.kioskOnDuty();
      const list = resp.data || [];
      
      const newCache = { ...qrCache };
      for (const p of list) {
        if (p.barcode_token && !newCache[p.barcode_token]) {
          // Generate QR dengan warna dark-slate untuk kontras di card putih
          const dataUrl = await QRCode.toDataURL(p.barcode_token, {
            width: 400,
            margin: 2,
            color: { dark: "#1e293b", light: "#ffffff" },
          });
          newCache[p.barcode_token] = dataUrl;
        }
      }
      setQrCache(newCache);
      setPetugas(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F6F5F] via-[#2FA084] to-[#6FCF97] p-6 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kiosk QR Petugas</h1>
          <p className="text-emerald-50 text-sm mt-1">Silakan scan barcode di bawah ini untuk menilai layanan</p>
        </div>
        <button 
          onClick={() => navigate('/kiosk')} 
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2 rounded-xl transition-all inline-flex items-center gap-2"
        >
          <X className="w-5 h-5" /> Kembali
        </button>
      </div>

      {/* Grid */}
      <motion.div 
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <AnimatePresence>
          {petugas.map((p) => (
            <motion.div
              key={p.petugas_id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white text-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center transform hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="p-2 border-2 border-slate-100 rounded-2xl mb-4 bg-white">
                {qrCache[p.barcode_token] ? (
                  <img src={qrCache[p.barcode_token]} alt="QR" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center animate-pulse bg-slate-100">Loading...</div>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {p.nama_petugas}
                </h3>
                <p className="text-sm text-blue-600 font-semibold mt-1">
                  {p.jabatan}
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest">
                  {p.nip}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Footer Refresh Note */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-emerald-100/70 text-xs">
        Halaman diperbarui otomatis setiap 30 detik
      </div>
    </div>
  );
}