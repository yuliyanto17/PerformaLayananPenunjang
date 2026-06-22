// src/routes/pasien.routes.js

/**
 * ============================================
 * PASIEN ROUTES
 * ============================================
 * 
 * Base URL: /api/v1/pasien
 * Data dari Production Database
 */

const express = require('express');
const router = express.Router();
const pasienController = require('../controllers/pasien.controller');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const searchPasienSchema = Joi.object({
  q: Joi.string()
    .required()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Keyword tidak boleh kosong',
      'string.min': 'Keyword minimal 3 karakter',
      'any.required': 'Keyword wajib diisi',
    }),
  
  medis: Joi.string()
    .max(50)
    .optional(),
  
  ket_masuk: Joi.string()
    .max(50)
    .optional(),
});

const checkAssessmentSchema = Joi.object({
  layanan_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'layanan_id wajib diisi',
    }),
});

/**
 * Routes
 */

// GET /api/v1/pasien/search?q=keyword
// Search pasien by No MR or Nama
router.get(
  '/search',
  validate(searchPasienSchema, 'query'),
  pasienController.search
);

// GET /api/v1/pasien/today
// Get today's pasien list
router.get('/today', pasienController.getTodayList);

// GET /api/v1/pasien/mr/:noMR
// Get pasien by No MR
router.get('/mr/:noMR', pasienController.getByNoMR);

// GET /api/v1/pasien/reg/:noReg
// Get pasien by No Registrasi
router.get('/reg/:noReg', pasienController.getByNoReg);

// GET /api/v1/pasien/:noMR/assessment-check?layanan_id=1
// Check if pasien has been assessed today
router.get(
  '/:noMR/assessment-check',
  validate(checkAssessmentSchema, 'query'),
  pasienController.checkAssessment
);

// GET /api/v1/pasien/:noMR/assessment-history
// Get assessment history for pasien
router.get(
  '/:noMR/assessment-history',
  pasienController.getAssessmentHistory
);

module.exports = router;