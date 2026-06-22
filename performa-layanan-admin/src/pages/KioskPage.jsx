import React, { useCallback, useEffect, useRef, useState } from "react";
import AdminShell from "../components/AdminShell";
import { adminApi } from "../api/adminApi";
import QRCode from "qrcode";
import { Maximize2, RefreshCw, Users, AlertCircle, X, Power } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Modal from "../components/ui/Modal";


export default function KioskPage() {
  const [loading, setLoading] = useState(true);
  const [petugas, setPetugas] = useState([]);
  const [qrCache, setQrCache] = useState({});
  const [showEndAllModal, setShowEndAllModal] = useState(false);

  // Use a ref so the interval callback always reads the latest cache without
  // needing to be recreated every render (avoids stale-closure bug).
  const qrCacheRef = useRef({});

  const load = useCallback(async () => {
    try {
      const resp = await adminApi.kioskOnDuty();
      const list = resp.data || [];

      const newCache = { ...qrCacheRef.current };
      for (const p of list) {
        if (p.barcode_token && !newCache[p.barcode_token]) {
          const dataUrl = await QRCode.toDataURL(p.barcode_token, {
            width: 400, margin: 2, color: { dark: "#11423a", light: "#ffffff" }
          });
          newCache[p.barcode_token] = dataUrl;
        }
      }
      qrCacheRef.current = newCache;
      setQrCache(newCache);
      setPetugas(list);
    } catch (e) {
      toast.error("Gagal refresh data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const openFullscreenView = () => {
    // Buka window baru / redirect ke route baru
    const newWindow = window.open('/kiosk-full', '_blank');

    // Auto fullscreen window baru jika didukung
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.document.documentElement.requestFullscreen();
      };
    }
  };

  const handleEndShift = async (petugas_id) => {
    if (!window.confirm("Selesaikan shift petugas ini?")) return;
    try {
      await adminApi.toggleDuty(petugas_id, false);
      toast.success("Shift selesai");
      load();
    } catch (e) {
      toast.error("Gagal");
    }
  };

  const handleEndAll = async () => {
    try {
      await adminApi.shiftEndAll(); // Pastikan method ini ada di adminApi.js
      toast.success("Semua shift selesai");
      setShowEndAllModal(false);
      load();
    } catch (e) {
      toast.error("Gagal menyelesaikan shift");
    }
  };

  return (
    <AdminShell title="Kiosk QR Board">
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-5 h-5" />
            <span className="font-medium">{petugas.length} Petugas On Duty</span>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</button>
            <button className="btn btn-primary" onClick={setShowEndAllModal}><Power className="w-4 h-4" /> Selesaikan Semua</button>
            <button
              className="btn btn-primary"
              onClick={openFullscreenView}
            >
              <Maximize2 className="w-4 h-4" /> Buka Fullscreen View
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {petugas.map((p) => (
              <motion.div key={p.petugas_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="card p-4 relative group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  {/* Close button per card */}
                  <button
                    onClick={() => handleEndShift(p.petugas_id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    title="Selesaikan Shift"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center">
                    <img src={qrCache[p.barcode_token]} alt="QR" className="w-40 h-40" />
                    <div className="mt-3 text-center">
                      <div className="font-bold text-slate-900">{p.nama_petugas}</div>
                      <div className="text-sm text-blue-600 font-semibold mt-1">{p.jabatan}</div>
                      <div className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest">{p.nip}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      {/* MODAL KONFIRMASI */}
      <Modal
        isOpen={showEndAllModal}
        onClose={() => setShowEndAllModal(false)}
        onConfirm={handleEndAll}
        title="Selesaikan Semua Shift?"
        message="Tindakan ini akan mengakhiri shift semua petugas yang sedang bertugas saat ini. Anda yakin?"
        confirmText="Ya, Selesaikan"
      />
    </AdminShell>
  );
}