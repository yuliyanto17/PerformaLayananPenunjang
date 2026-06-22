// src/components/common/ConfirmSubmitModal.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, CheckCircle2, User, Stethoscope, ClipboardList, AlertTriangle } from 'lucide-react';
import Button from './Button';

const ConfirmSubmitModal = ({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
  layanan,
  pasien,
  petugas,
  totalPertanyaan,
  totalTerjawab,
  progress,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!submitting ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

              {/* Header */}
              <div className="bg-primary-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Konfirmasi Kirim Penilaian</h2>
                    <p className="text-primary-100 text-sm">Periksa kembali sebelum mengirim</p>
                  </div>
                </div>
                {!submitting && (
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ringkasan Penilaian
                  </p>

                  <div className="space-y-2.5">
                    <SummaryRow
                      icon={<Stethoscope className="w-4 h-4 text-primary-500" />}
                      label="Layanan"
                      value={layanan?.layanan_name || '-'}
                    />
                    <SummaryRow
                      icon={<User className="w-4 h-4 text-blue-500" />}
                      label="Pasien"
                      value={pasien?.Nama_Pasien || '-'}
                    />
                    <SummaryRow
                      icon={<User className="w-4 h-4 text-green-500" />}
                      label="Petugas"
                      value={petugas?.nama_petugas || '-'}
                    />
                    <SummaryRow
                      icon={<ClipboardList className="w-4 h-4 text-orange-500" />}
                      label="Pertanyaan Dijawab"
                      value={
                        <span className="font-semibold text-gray-900">
                          {totalTerjawab}
                          <span className="text-gray-400 font-normal"> / {totalPertanyaan}</span>
                        </span>
                      }
                    />
                  </div>

                  {/* Progress mini bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-primary-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-2 bg-primary-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Penilaian <strong>tidak dapat diubah</strong> setelah dikirim. Pastikan semua
                    jawaban sudah sesuai.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  variant="success"
                  icon={Send}
                  iconPosition="right"
                  className="flex-1"
                  onClick={onConfirm}
                  loading={submitting}
                >
                  Kirim Penilaian
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SummaryRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <span className="text-sm text-gray-500 w-32 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900 truncate">{value}</span>
  </div>
);

export default ConfirmSubmitModal;
