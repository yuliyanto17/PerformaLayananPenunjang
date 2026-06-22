// src/routes/penilaian.routes.js

/**
 * ============================================
 * PENILAIAN ROUTES
 * ============================================
 * 
 * Base URL: /api/v1/penilaian
 * Main flow untuk form penilaian
 */

const express = require('express');
const router = express.Router();
const penilaianController = require('../controllers/penilaian.controller');
const { validate } = require('../middleware/validator');
const { strictLimiter } = require('../middleware/security');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const startPenilaianSchema = Joi.object({
  // Data Pasien
  no_reg: Joi.string()
    .required()
    .max(50)
    .messages({
      'string.empty': 'No. Registrasi tidak boleh kosong',
      'any.required': 'No. Registrasi wajib diisi',
    }),
  
  no_mr: Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': 'No. MR wajib diisi',
    }),
  
  nama_pasien: Joi.string()
    .required()
    .max(200)
    .messages({
      'any.required': 'Nama pasien wajib diisi',
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
    .allow(null, ''),
  
  nama_rekanan: Joi.string()
    .max(200)
    .optional()
    .allow(null, ''),
  
  // Layanan & Petugas
  layanan_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Layanan ID wajib diisi',
    }),
  
  petugas_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Petugas ID wajib diisi',
    }),
  
  // Device Info
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

const saveAnswerSchema = Joi.object({
  pertanyaan_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Pertanyaan ID wajib diisi',
    }),
  
  nilai_rating: Joi.number()
    .integer()
    .min(0)
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
    .min(0)
    .optional(),
});

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

const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required(),
});

/**
 * Routes
 */

// GET /api/v1/penilaian/summary
// Get summary for dashboard
router.get('/summary', penilaianController.getSummary);

// GET /api/v1/penilaian
// Get penilaian list with pagination
router.get('/', penilaianController.getList);

// GET /api/v1/penilaian/:id
// Get penilaian by ID
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  penilaianController.getById
);

// POST /api/v1/penilaian/start
// Start new penilaian (create draft)
router.post(
  '/start',
  strictLimiter, // Rate limit untuk prevent spam
  validate(startPenilaianSchema, 'body'),
  penilaianController.start
);

// PUT /api/v1/penilaian/:id/answer
// Save answer (auto-save)
router.put(
  '/:id/answer',
  validate(idParamSchema, 'params'),
  validate(saveAnswerSchema, 'body'),
  penilaianController.saveAnswer
);

// POST /api/v1/penilaian/:id/submit
// Submit final penilaian
router.post(
  '/:id/submit',
  strictLimiter, // Rate limit untuk prevent spam
  validate(idParamSchema, 'params'),
  validate(submitPenilaianSchema, 'body'),
  penilaianController.submit
);

// DELETE /api/v1/penilaian/:id
// Delete penilaian (draft only)
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  penilaianController.delete
);

module.exports = router;