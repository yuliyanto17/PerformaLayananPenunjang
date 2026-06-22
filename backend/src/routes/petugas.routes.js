// src/routes/petugas.routes.js

/**
 * ============================================
 * PETUGAS ROUTES
 * ============================================
 * 
 * Base URL: /api/v1/petugas
 */

const express = require('express');
const router = express.Router();
const petugasController = require('../controllers/petugas.controller');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const createPetugasSchema = Joi.object({
  nip: Joi.string()
    .required()
    .max(50)
    .messages({
      'string.empty': 'NIP tidak boleh kosong',
      'any.required': 'NIP wajib diisi',
    }),
  
  nama_petugas: Joi.string()
    .required()
    .max(200)
    .messages({
      'string.empty': 'Nama petugas tidak boleh kosong',
      'any.required': 'Nama petugas wajib diisi',
    }),
  
  layanan_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Layanan ID wajib diisi',
    }),
  
  jabatan: Joi.string()
    .max(100)
    .optional()
    .allow(null, ''),
  
  email: Joi.string()
    .email()
    .max(100)
    .optional()
    .allow(null, ''),
  
  no_telp: Joi.string()
    .max(20)
    .optional()
    .allow(null, ''),
  
  foto_url: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  is_on_duty: Joi.boolean()
    .optional()
    .default(false),
});

const updatePetugasSchema = Joi.object({
  nama_petugas: Joi.string()
    .required()
    .max(200),
  
  jabatan: Joi.string()
    .max(100)
    .optional()
    .allow(null, ''),
  
  email: Joi.string()
    .email()
    .max(100)
    .optional()
    .allow(null, ''),
  
  no_telp: Joi.string()
    .max(20)
    .optional()
    .allow(null, ''),
  
  foto_url: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  is_on_duty: Joi.boolean()
    .optional(),
  
  shift_current: Joi.string()
    .valid('PAGI', 'SIANG', 'MALAM')
    .optional()
    .allow(null, ''),
});

const toggleOnDutySchema = Joi.object({
  is_on_duty: Joi.boolean()
    .required()
    .messages({
      'any.required': 'is_on_duty wajib diisi',
    }),
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

router.get("/filter", petugasController.getFilteredPetugas);
// GET /api/v1/petugas
// Get all petugas with optional filters
router.get('/', petugasController.getAll);

// GET /api/v1/petugas/:id
// Get petugas by ID
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  petugasController.getById
);

// GET /api/v1/petugas/barcode/:token
// Get petugas by barcode token
router.get(
  '/barcode/:token',
  petugasController.getByBarcodeToken
);

// GET /api/v1/petugas/:id/statistics
// Get petugas statistics
router.get(
  '/:id/statistics',
  validate(idParamSchema, 'params'),
  petugasController.getStatistics
);

// POST /api/v1/petugas
// Create new petugas
router.post(
  '/',
  validate(createPetugasSchema, 'body'),
  petugasController.create
);

// PUT /api/v1/petugas/:id
// Update petugas
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updatePetugasSchema, 'body'),
  petugasController.update
);

// PATCH /api/v1/petugas/:id/toggle-duty
// Toggle on duty status
router.patch(
  '/:id/toggle-duty',
  validate(idParamSchema, 'params'),
  validate(toggleOnDutySchema, 'body'),
  petugasController.toggleOnDuty
);

// DELETE /api/v1/petugas/:id
// Delete petugas
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  petugasController.delete
);


module.exports = router;