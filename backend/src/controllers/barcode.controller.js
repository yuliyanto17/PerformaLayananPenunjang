// src/controllers/barcode.controller.js

/**
 * ============================================
 * BARCODE CONTROLLER
 * ============================================
 */

const barcodeService = require('../services/barcode.service');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class BarcodeController {
  
  /**
   * Validate Barcode
   * 
   * POST /api/v1/barcode/validate
   * 
   * Body:
   * {
   *   barcode_token: "PET-RAD-123456-A1B2C3",
   *   layanan_id: 1, // optional - untuk validasi match
   *   session_id: "xxx",
   *   device_type: "mobile"
   * }
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     petugas_id: 1,
   *     nip: "123456",
   *     nama_petugas: "Dr. Budi",
   *     layanan_name: "Radiologi",
   *     ...
   *   }
   * }
   */
  validate = asyncHandler(async (req, res) => {
    const { barcode_token, layanan_id, session_id, device_type } = req.body;
    
    const context = {
      layanan_id: layanan_id ? parseInt(layanan_id) : undefined,
      session_id,
      device_type,
      ip_address: req.ip,
      browser_info: req.get('user-agent'),
    };
    
    // Log scan attempt
    logger.logEvent('BARCODE_SCAN', {
      token: barcode_token.substring(0, 10) + '...', // Log partial token untuk security
      layanan_id,
      ip: req.ip,
    });
    
    const petugas = await barcodeService.validate(barcode_token, context);
    
    return successResponse(
      res,
      petugas,
      'Barcode validated successfully'
    );
  });
  
  /**
   * Generate QR Code for Petugas
   * 
   * POST /api/v1/barcode/generate/:petugasId
   * 
   * Generate dan save QR code image untuk petugas
   */
  generateQRCode = asyncHandler(async (req, res) => {
    const { petugasId } = req.params;
    
    logger.logEvent('QR_CODE_GENERATED', {
      petugas_id: petugasId,
    });
    
    const result = await barcodeService.generateQRCode(parseInt(petugasId));
    
    return successResponse(
      res,
      result,
      'QR Code generated successfully'
    );
  });
  
  /**
   * Get QR Code as Base64
   * 
   * GET /api/v1/barcode/qr/:token
   * 
   * Return QR code as base64 string untuk display langsung
   */
  getQRCodeBase64 = asyncHandler(async (req, res) => {
    const { token } = req.params;
    
    const qrBase64 = await barcodeService.getQRCodeBase64(token);
    
    return successResponse(
      res,
      {
        qr_code: qrBase64,
        token,
      },
      'QR Code retrieved successfully'
    );
  });
  
  /**
   * Get Scan Statistics
   * 
   * GET /api/v1/barcode/stats
   * 
   * Query params:
   * - petugas_id (optional)
   * - date_from (optional)
   * - date_to (optional)
   */
  getScanStats = asyncHandler(async (req, res) => {
    const filters = {
      petugas_id: req.query.petugas_id ? parseInt(req.query.petugas_id) : undefined,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };
    
    const stats = await barcodeService.getScanStats(filters);
    
    return successResponse(
      res,
      stats,
      'Scan statistics retrieved successfully'
    );
  });
}

module.exports = new BarcodeController();