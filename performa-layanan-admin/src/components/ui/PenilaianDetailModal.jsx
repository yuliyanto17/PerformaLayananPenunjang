import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, Star } from "lucide-react";

export default function PenilaianDetailModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10"
        >
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold">Detail Penilaian #{data.penilaian_no}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Pasien</p><p className="font-semibold">{data.nama_pasien}</p></div>
              <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Petugas</p><p className="font-semibold">{data.nama_petugas}</p></div>
            </div>

            {/* Jawaban Table */}
            <div className="space-y-4">
              {data.details?.map((item) => (
                <div key={item.detail_id} className="border-b pb-3">
                  <div className="text-sm font-medium text-slate-700">{item.pertanyaan_text}</div>
                  <div className="text-blue-600 font-semibold mt-1">
                    {item.tipe_input === 'rating_5' ? `${item.nilai_rating} Bintang` : (item.jawaban_pilihan || item.jawaban_text || "-")}
                  </div>
                  {item.komentar && <p className="text-xs text-slate-500 italic mt-1">"{item.komentar}"</p>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}