// src/routes/barcode.routes.js

/**
 * ============================================
 * BARCODE ROUTES
 * ============================================
 * 
 * Base URL: /api/v1/barcode
 */

const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcode.controller');
const { validate } = require('../middleware/validator');
const { strictLimiter } = require('../middleware/security');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const validateBarcodeSchema = Joi.object({
  barcode_token: Joi.string()
    .required()
    .max(255)
    .messages({
      'string.empty': 'Barcode token tidak boleh kosong',
      'any.required': 'Barcode token wajib diisi',
    }),
  
  layanan_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  session_id: Joi.string()
    .max(100)
    .optional(),
  
  device_type: Joi.string()
    .valid('mobile', 'tablet', 'desktop')
    .optional(),
});

const petugasIdParamSchema = Joi.object({
  petugasId: Joi.number()
    .integer()
    .positive()
    .required(),
});

/**
 * Routes
 */

// POST /api/v1/barcode/validate
// Validate barcode scan
router.post(
  '/validate',
  strictLimiter, // Prevent brute force scanning
  validate(validateBarcodeSchema, 'body'),
  barcodeController.validate
);

// POST /api/v1/barcode/generate/:petugasId
// Generate QR code for petugas
router.post(
  '/generate/:petugasId',
  validate(petugasIdParamSchema, 'params'),
  barcodeController.generateQRCode
);

// GET /api/v1/barcode/qr/:token
// Get QR code as base64
router.get('/qr/:token', barcodeController.getQRCodeBase64);

// GET /api/v1/barcode/stats
// Get scan statistics
router.get('/stats', barcodeController.getScanStats);

module.exports = router;