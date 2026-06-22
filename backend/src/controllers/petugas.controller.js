// src/controllers/petugas.controller.js

/**
 * ============================================
 * PETUGAS CONTROLLER
 * ============================================
 */

const petugasService = require('../services/petugas.service');
const { successResponse, createdResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class PetugasController {
  
  /**
   * Get All Petugas
   * 
   * GET /api/v1/petugas
   * Query params:
   * - layanan_id (optional)
   * - is_active (optional)
   * - is_on_duty (optional)
   */
  getAll = asyncHandler(async (req, res) => {
    const filters = {
      layanan_id: req.query.layanan_id ? parseInt(req.query.layanan_id) : undefined,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
      is_on_duty: req.query.is_on_duty !== undefined ? req.query.is_on_duty === 'true' : undefined,
    };
    
    const petugas = await petugasService.getAll(filters);
    
    return successResponse(
      res,
      petugas,
      'Petugas list retrieved successfully'
    );
  });
  
  /**
   * Get Petugas by ID
   * 
   * GET /api/v1/petugas/:id
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const petugas = await petugasService.getById(parseInt(id));
    
    return successResponse(
      res,
      petugas,
      'Petugas retrieved successfully'
    );
  });
  
  /**
   * Get Petugas by Barcode Token
   * 
   * GET /api/v1/petugas/barcode/:token
   */
  getByBarcodeToken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    
    const petugas = await petugasService.getByBarcodeToken(token);
    
    return successResponse(
      res,
      petugas,
      'Petugas retrieved successfully'
    );
  });
  
  /**
   * Create New Petugas
   * 
   * POST /api/v1/petugas
   * 
   * Body:
   * {
   *   nip: "123456",
   *   nama_petugas: "Dr. John Doe",
   *   layanan_id: 1,
   *   jabatan: "Dokter Radiologi",
   *   email: "john@example.com",
   *   no_telp: "081234567890"
   * }
   */
  create = asyncHandler(async (req, res) => {
    const data = req.body;
    
    const petugas = await petugasService.create(data);
    
    return createdResponse(
      res,
      petugas,
      'Petugas created successfully'
    );
  });
  
  /**
   * Update Petugas
   * 
   * PUT /api/v1/petugas/:id
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    const petugas = await petugasService.update(parseInt(id), data);
    
    return successResponse(
      res,
      petugas,
      'Petugas updated successfully'
    );
  });
  
  /**
   * Delete Petugas
   * 
   * DELETE /api/v1/petugas/:id
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await petugasService.delete(parseInt(id));
    
    return successResponse(
      res,
      null,
      'Petugas deleted successfully'
    );
  });
  
  /**
   * Toggle On Duty Status
   * 
   * PATCH /api/v1/petugas/:id/toggle-duty
   * 
   * Body:
   * {
   *   is_on_duty: true
   * }
   */
  toggleOnDuty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_on_duty } = req.body;
    
    const petugas = await petugasService.toggleOnDuty(parseInt(id), is_on_duty);
    
    return successResponse(
      res,
      petugas,
      `Petugas is now ${is_on_duty ? 'on duty' : 'off duty'}`
    );
  });
  
  /**
   * Get Petugas Statistics
   * 
   * GET /api/v1/petugas/:id/statistics
   * Query params:
   * - start_date (optional)
   * - end_date (optional)
   */
  getStatistics = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const dateRange = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    };
    
    const stats = await petugasService.getStatistics(parseInt(id), dateRange);
    
    return successResponse(
      res,
      stats,
      'Petugas statistics retrieved successfully'
    );
  });

  getFilteredPetugas = asyncHandler(async (req, res) => {
    const { layanan_id, layanan_code } = req.query;
    const data = await petugasService.getFilteredPetugas(parseInt(layanan_id), layanan_code);
    return successResponse(res, data, "OK");
  });
}

module.exports = new PetugasController();