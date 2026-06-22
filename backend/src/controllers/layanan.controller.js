// src/controllers/layanan.controller.js

/**
 * ============================================
 * LAYANAN CONTROLLER
 * ============================================
 * 
 * Handle HTTP requests untuk layanan endpoints
 */

const layananService = require('../services/layanan.service');
const { successResponse, createdResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class LayananController {
  
  /**
   * Get All Layanan
   * 
   * GET /api/v1/layanan
   * 
   * Response:
   * {
   *   success: true,
   *   message: "Layanan retrieved successfully",
   *   data: [...]
   * }
   */
  getAll = asyncHandler(async (req, res) => {
    // Call service
    const layanan = await layananService.getAll();
    
    // Send response
    return successResponse(
      res,
      layanan,
      'Layanan retrieved successfully'
    );
  });
  
  /**
   * Get Layanan by ID
   * 
   * GET /api/v1/layanan/:id
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const layanan = await layananService.getById(parseInt(id));
    
    return successResponse(
      res,
      layanan,
      'Layanan retrieved successfully'
    );
  });
  
  /**
   * Get Layanan with Statistics
   * 
   * GET /api/v1/layanan/:id/stats
   */
  getWithStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const layanan = await layananService.getWithStats(parseInt(id));
    
    return successResponse(
      res,
      layanan,
      'Layanan with statistics retrieved successfully'
    );
  });
  
  /**
   * Create New Layanan
   * 
   * POST /api/v1/layanan
   * 
   * Body:
   * {
   *   layanan_code: "TEST",
   *   layanan_name: "Test Layanan",
   *   deskripsi: "...",
   *   icon_name: "test-icon",
   *   color_hex: "#3b82f6",
   *   sort_order: 0
   * }
   */
  create = asyncHandler(async (req, res) => {
    const data = req.body;
    
    // Check if code already exists
    const codeExists = await layananService.isCodeExists(data.layanan_code);
    if (codeExists) {
      throw new ApiError(409, 'Layanan code already exists');
    }
    
    const layanan = await layananService.create(data);
    
    return createdResponse(
      res,
      layanan,
      'Layanan created successfully'
    );
  });
  
  /**
   * Update Layanan
   * 
   * PUT /api/v1/layanan/:id
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    const layanan = await layananService.update(parseInt(id), data);
    
    return successResponse(
      res,
      layanan,
      'Layanan updated successfully'
    );
  });
  
  /**
   * Delete Layanan (Soft Delete)
   * 
   * DELETE /api/v1/layanan/:id
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await layananService.delete(parseInt(id));
    
    return successResponse(
      res,
      null,
      'Layanan deleted successfully'
    );
  });
}

module.exports = new LayananController();