// src/validators/penilaian.validator.js

/**
 * ============================================
 * VALIDATION SCHEMAS - PENILAIAN
 * ============================================
 * 
 * Menggunakan Joi untuk validasi input request
 * Joi = library validation yang powerful dan flexible
 */

const Joi = require('joi');

/**
 * Schema untuk Start Penilaian
 * 
 * Validasi data saat mulai penilaian baru
 */
const startPenilaianSchema = Joi.object({
  // Data dari Production DB
  no_reg: Joi.string()
    .required()
    .max(50)
    .messages({
      'string.empty': 'No. Registrasi tidak boleh kosong',
      'string.max': 'No. Registrasi maksimal 50 karakter',
      'any.required': 'No. Registrasi wajib diisi'
    }),
  
  no_mr: Joi.string()
    .required()
    .max(50)
    .messages({
      'string.empty': 'No. MR tidak boleh kosong',
      'any.required': 'No. MR wajib diisi'
    }),
  
  nama_pasien: Joi.string()
    .required()
    .max(200)
    .messages({
      'string.empty': 'Nama pasien tidak boleh kosong',
      'any.required': 'Nama pasien wajib diisi'
    }),
  
  tgl_masuk: Joi.date()
    .optional()
    .allow(null),
  
  medis: Joi.string()
    .max(50)
    .optional()
    .allow(null, ''),
  
  jenis_kelamin: Joi.string()
    .valid('L', 'P')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'Jenis kelamin harus L atau P'
    }),
  
  nama_rekanan: Joi.string()
    .max(200)
    .optional()
    .allow(null, ''),
  
  // Data Layanan & Petugas
  layanan_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Layanan ID harus berupa angka',
      'number.positive': 'Layanan ID harus positif',
      'any.required': 'Layanan ID wajib diisi'
    }),
  
  petugas_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Petugas ID harus berupa angka',
      'any.required': 'Petugas ID wajib diisi'
    }),
  
  // Device Info (optional tapi recommended)
  device_type: Joi.string()
    .valid('mobile', 'tablet', 'desktop')
    .optional(),
  
  browser_name: Joi.string()
    .max(50)
    .optional(),
  
  browser_version: Joi.string()
    .max(20)
    .optional(),
  
  os_name: Joi.string()
    .max(50)
    .optional(),
  
  screen_size: Joi.string()
    .max(20)
    .optional(),
  
  session_id: Joi.string()
    .max(100)
    .optional(),
});

/**
 * Schema untuk Save Answer
 * 
 * Validasi saat save jawaban (auto-save)
 */
const saveAnswerSchema = Joi.object({
  pertanyaan_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Pertanyaan ID wajib diisi'
    }),
  
  // Jawaban (salah satu harus ada tergantung tipe pertanyaan)
  nilai_rating: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null),
  
  jawaban_text: Joi.string()
    .max(4000)
    .optional()
    .allow(null, ''),
  
  jawaban_boolean: Joi.boolean()
    .optional()
    .allow(null),
  
  jawaban_pilihan: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  komentar: Joi.string()
    .max(1000)
    .optional()
    .allow(null, ''),
  
  urutan_jawab: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  durasi_jawab: Joi.number()
    .integer()
    .optional(), // dalam detik
});

/**
 * Schema untuk Submit Penilaian
 * 
 * Validasi saat submit final penilaian
 */
const submitPenilaianSchema = Joi.object({
  komentar_umum: Joi.string()
    .max(4000)
    .optional()
    .allow(null, ''),
  
  saran: Joi.string()
    .max(4000)
    .optional()
    .allow(null, ''),
  
  nps_score: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .optional()
    .allow(null),
});

/**
 * Schema untuk Validate Barcode
 */
const validateBarcodeSchema = Joi.object({
  barcode_token: Joi.string()
    .required()
    .max(255)
    .messages({
      'string.empty': 'Barcode token tidak boleh kosong',
      'any.required': 'Barcode token wajib diisi'
    }),
  
  layanan_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  session_id: Joi.string()
    .max(100)
    .optional(),
  
  device_info: Joi.object().optional(),
});

/**
 * Schema untuk Search Pasien
 */
const searchPasienSchema = Joi.object({
  q: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Keyword minimal 3 karakter',
      'string.empty': 'Keyword tidak boleh kosong',
      'any.required': 'Keyword wajib diisi'
    }),
  
  layanan_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
});

/**
 * Schema untuk Get Penilaian by ID
 */
const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID harus berupa angka',
      'any.required': 'ID wajib diisi'
    }),
});

module.exports = {
  startPenilaianSchema,
  saveAnswerSchema,
  submitPenilaianSchema,
  validateBarcodeSchema,
  searchPasienSchema,
  idParamSchema,
};