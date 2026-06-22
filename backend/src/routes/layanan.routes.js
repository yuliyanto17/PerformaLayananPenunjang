// src/routes/layanan.routes.js

/**
 * ============================================
 * LAYANAN ROUTES
 * ============================================
 * 
 * Endpoints untuk master layanan penunjang
 * Base URL: /api/v1/layanan
 */

const express = require('express');
const router = express.Router();
const layananController = require('../controllers/layanan.controller');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const createLayananSchema = Joi.object({
  layanan_code: Joi.string()
    .required()
    .max(20)
    .uppercase()
    .regex(/^[A-Z0-9_]+$/)
    .messages({
      'string.empty': 'Kode layanan tidak boleh kosong',
      'string.max': 'Kode layanan maksimal 20 karakter',
      'string.pattern.base': 'Kode layanan hanya boleh huruf kapital, angka, dan underscore',
      'any.required': 'Kode layanan wajib diisi',
    }),
  
  layanan_name: Joi.string()
    .required()
    .max(100)
    .messages({
      'string.empty': 'Nama layanan tidak boleh kosong',
      'any.required': 'Nama layanan wajib diisi',
    }),
  
  deskripsi: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  icon_name: Joi.string()
    .max(50)
    .optional()
    .allow(null, ''),
  
  color_hex: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Format warna harus #RRGGBB',
    }),
  
  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),
});

const updateLayananSchema = Joi.object({
  layanan_name: Joi.string()
    .required()
    .max(100),
  
  deskripsi: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  icon_name: Joi.string()
    .max(50)
    .optional()
    .allow(null, ''),
  
  color_hex: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  
  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional(),
});

const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID harus berupa angka',
      'any.required': 'ID wajib diisi',
    }),
});

/**
 * Routes
 */

// GET /api/v1/layanan
// Get all active layanan
router.get('/', layananController.getAll);

// GET /api/v1/layanan/:id
// Get layanan by ID
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  layananController.getById
);

// GET /api/v1/layanan/:id/stats
// Get layanan with statistics
router.get(
  '/:id/stats',
  validate(idParamSchema, 'params'),
  layananController.getWithStats
);

// POST /api/v1/layanan
// Create new layanan
router.post(
  '/',
  validate(createLayananSchema, 'body'),
  layananController.create
);

// PUT /api/v1/layanan/:id
// Update layanan
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateLayananSchema, 'body'),
  layananController.update
);

// DELETE /api/v1/layanan/:id
// Delete (soft delete) layanan
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  layananController.delete
);

module.exports = router;