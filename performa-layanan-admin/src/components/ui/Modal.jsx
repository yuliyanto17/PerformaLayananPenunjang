import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmText = "Konfirmasi" }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6"
        >
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600 mt-2">{message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button onClick={onConfirm} className="btn btn-primary bg-red-600 hover:bg-red-700">
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}