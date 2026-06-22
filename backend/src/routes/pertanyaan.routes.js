// src/routes/pertanyaan.routes.js

/**
 * ============================================
 * PERTANYAAN ROUTES
 * ============================================
 * 
 * Base URL: /api/v1/pertanyaan
 */

const express = require('express');
const router = express.Router();
const pertanyaanController = require('../controllers/pertanyaan.controller');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const createPertanyaanSchema = Joi.object({
  layanan_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null),
  
  kategori_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Kategori ID wajib diisi',
    }),
  
  template_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Template ID wajib diisi',
    }),
  
  pertanyaan_code: Joi.string()
    .required()
    .max(50)
    .uppercase()
    .messages({
      'any.required': 'Kode pertanyaan wajib diisi',
    }),
  
  pertanyaan_text: Joi.string()
    .required()
    .max(1000)
    .messages({
      'any.required': 'Text pertanyaan wajib diisi',
    }),
  
  pertanyaan_subtitle: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  placeholder_text: Joi.string()
    .max(200)
    .optional()
    .allow(null, ''),
  
  has_custom_opsi: Joi.boolean()
    .optional()
    .default(false),
  
  is_required: Joi.boolean()
    .optional()
    .default(true),
  
  allow_comment: Joi.boolean()
    .optional()
    .default(false),
  
  bobot: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  
  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),
  
  opsi_jawaban: Joi.array()
    .items(
      Joi.object({
        nilai: Joi.number().integer().required(),
        label: Joi.string().max(200).required(),
        emoji: Joi.string().max(10).optional().allow(null, ''),
        color_hex: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
        sort_order: Joi.number().integer().optional().default(0),
      })
    )
    .optional(),
});

const updatePertanyaanSchema = Joi.object({
  pertanyaan_text: Joi.string()
    .required()
    .max(1000),
  
  pertanyaan_subtitle: Joi.string()
    .max(500)
    .optional()
    .allow(null, ''),
  
  placeholder_text: Joi.string()
    .max(200)
    .optional()
    .allow(null, ''),
  
  is_required: Joi.boolean()
    .optional(),
  
  allow_comment: Joi.boolean()
    .optional(),
  
  bobot: Joi.number()
    .integer()
    .min(1)
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
    .required(),
});

const layananIdParamSchema = Joi.object({
  layananId: Joi.number()
    .integer()
    .positive()
    .required(),
});

/**
 * Routes
 */

// GET /api/v1/pertanyaan/kategori
// Get all kategori pertanyaan
router.get('/kategori', pertanyaanController.getKategori);

// GET /api/v1/pertanyaan/template
// Get all template jawaban
router.get('/template', pertanyaanController.getTemplate);

// GET /api/v1/pertanyaan/layanan/:layananId
// Get pertanyaan by layanan (for penilaian form)
router.get(
  '/layanan/:layananId',
  validate(layananIdParamSchema, 'params'),
  pertanyaanController.getByLayanan
);

// GET /api/v1/pertanyaan
// Get all pertanyaan (for admin)
router.get('/', pertanyaanController.getAll);

// GET /api/v1/pertanyaan/:id
// Get pertanyaan by ID
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  pertanyaanController.getById
);

// POST /api/v1/pertanyaan
// Create new pertanyaan
router.post(
  '/',
  validate(createPertanyaanSchema, 'body'),
  pertanyaanController.create
);

// PUT /api/v1/pertanyaan/:id
// Update pertanyaan
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updatePertanyaanSchema, 'body'),
  pertanyaanController.update
);

// DELETE /api/v1/pertanyaan/:id
// Delete pertanyaan
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  pertanyaanController.delete
);

module.exports = router;