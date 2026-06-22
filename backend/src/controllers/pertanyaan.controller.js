// src/controllers/pertanyaan.controller.js

/**
 * ============================================
 * PERTANYAAN CONTROLLER
 * ============================================
 */

const pertanyaanService = require('../services/pertanyaan.service');
const { successResponse, createdResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const ApiError = require('../utils/ApiError');

class PertanyaanController {
  
  /**
   * Get Pertanyaan by Layanan
   * 
   * GET /api/v1/pertanyaan/layanan/:layananId
   * 
   * Ini endpoint yang akan dipanggil frontend saat load form penilaian
   * Return pertanyaan beserta opsi jawaban
   */
  getByLayanan = asyncHandler(async (req, res) => {
    const { layananId } = req.params;
    
    const pertanyaan = await pertanyaanService.getByLayanan(parseInt(layananId));
    
    return successResponse(
      res,
      pertanyaan,
      `Found ${pertanyaan.length} pertanyaan`
    );
  });
  
  /**
   * Get Pertanyaan by ID
   * 
   * GET /api/v1/pertanyaan/:id
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const pertanyaan = await pertanyaanService.getById(parseInt(id));
    
    return successResponse(
      res,
      pertanyaan,
      'Pertanyaan retrieved successfully'
    );
  });
  
  /**
   * Get All Pertanyaan (for admin)
   * 
   * GET /api/v1/pertanyaan
   * 
   * Query params:
   * - layanan_id (optional)
   * - kategori_id (optional)
   * - is_active (optional)
   */
  getAll = asyncHandler(async (req, res) => {
    const filters = {
      layanan_id: req.query.layanan_id ? parseInt(req.query.layanan_id) : undefined,
      kategori_id: req.query.kategori_id ? parseInt(req.query.kategori_id) : undefined,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
    };
    
    const pertanyaan = await pertanyaanService.getAll(filters);
    
    return successResponse(
      res,
      pertanyaan,
      `Found ${pertanyaan.length} pertanyaan`
    );
  });
  
  /**
   * Create Pertanyaan
   * 
   * POST /api/v1/pertanyaan
   * 
   * Body:
   * {
   *   layanan_id: 1,
   *   kategori_id: 1,
   *   template_id: 1,
   *   pertanyaan_code: "RAD_TEST",
   *   pertanyaan_text: "Test question?",
   *   is_required: true,
   *   sort_order: 1,
   *   has_custom_opsi: false
   * }
   */
  create = asyncHandler(async (req, res) => {
    const data = req.body;
    
    const pertanyaan = await pertanyaanService.create(data);
    
    return createdResponse(
      res,
      pertanyaan,
      'Pertanyaan created successfully'
    );
  });
  
  /**
   * Update Pertanyaan
   * 
   * PUT /api/v1/pertanyaan/:id
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    const pertanyaan = await pertanyaanService.update(parseInt(id), data);
    
    return successResponse(
      res,
      pertanyaan,
      'Pertanyaan updated successfully'
    );
  });
  
  /**
   * Delete Pertanyaan
   * 
   * DELETE /api/v1/pertanyaan/:id
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await pertanyaanService.delete(parseInt(id));
    
    return successResponse(
      res,
      null,
      'Pertanyaan deleted successfully'
    );
  });
  
  /**
   * Get Kategori Pertanyaan
   * 
   * GET /api/v1/pertanyaan/kategori
   */
  getKategori = asyncHandler(async (req, res) => {
    const kategori = await pertanyaanService.getKategori();
    
    return successResponse(
      res,
      kategori,
      'Kategori retrieved successfully'
    );
  });
  
  /**
   * Get Template Jawaban
   * 
   * GET /api/v1/pertanyaan/template
   */
  getTemplate = asyncHandler(async (req, res) => {
    const template = await pertanyaanService.getTemplate();
    
    return successResponse(
      res,
      template,
      'Template retrieved successfully'
    );
  });
}

module.exports = new PertanyaanController();