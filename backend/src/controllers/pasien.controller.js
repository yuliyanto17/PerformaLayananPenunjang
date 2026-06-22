// src/controllers/pasien.controller.js

/**
 * ============================================
 * PASIEN CONTROLLER
 * ============================================
 * 
 * Handle requests untuk data pasien (from Production DB)
 */

const pasienService = require('../services/pasien.service');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const ApiError = require('../utils/ApiError');

class PasienController {
  
  /**
   * Search Pasien
   * 
   * GET /api/v1/pasien/search
   * 
   * Query params:
   * - q: search keyword (No MR atau Nama) - REQUIRED, min 3 chars
   * - medis: filter by medis type (optional)
   * - ket_masuk: filter by ket_masuk (optional)
   * 
   * Example:
   * GET /api/v1/pasien/search?q=812151
   * GET /api/v1/pasien/search?q=FITRIYAH
   */
  search = asyncHandler(async (req, res) => {
    const { q, medis, ket_masuk } = req.query;
    
    // Validation (basic - detailed validation ada di middleware)
    if (!q || q.length < 3) {
      throw new ApiError(400, 'Keyword minimal 3 karakter');
    }
    
    const filters = {
      medis,
      ket_masuk,
    };
    
    const pasien = await pasienService.search(q, filters);
    
    return successResponse(
      res,
      pasien,
      `Found ${pasien.length} pasien`
    );
  });
  
  /**
   * Get Pasien by No MR
   * 
   * GET /api/v1/pasien/mr/:noMR
   * 
   * Example:
   * GET /api/v1/pasien/mr/812151
   */
  getByNoMR = asyncHandler(async (req, res) => {
    const { noMR } = req.params;
    
    const pasien = await pasienService.getByNoMR(noMR);
    
    return successResponse(
      res,
      pasien,
      'Pasien data retrieved successfully'
    );
  });
  
  /**
   * Get Pasien by No Registrasi
   * 
   * GET /api/v1/pasien/reg/:noReg
   * 
   * Example:
   * GET /api/v1/pasien/reg/26-00141166
   */
  getByNoReg = asyncHandler(async (req, res) => {
    const { noReg } = req.params;
    
    const pasien = await pasienService.getByNoReg(noReg);
    
    return successResponse(
      res,
      pasien,
      'Pasien data retrieved successfully'
    );
  });
  
  /**
   * Get Today's Pasien List
   * 
   * GET /api/v1/pasien/today
   * 
   * Query params:
   * - medis (optional)
   * - ket_masuk (optional)
   */
  getTodayList = asyncHandler(async (req, res) => {
    const filters = {
      medis: req.query.medis,
      ket_masuk: req.query.ket_masuk,
    };
    
    const pasien = await pasienService.getTodayList(filters);
    
    return successResponse(
      res,
      pasien,
      `Found ${pasien.length} pasien today`
    );
  });
  
  /**
   * Check Assessment Status
   * 
   * GET /api/v1/pasien/:noMR/assessment-check
   * 
   * Query params:
   * - layanan_id: REQUIRED
   * 
   * Check apakah pasien sudah pernah dinilai hari ini untuk layanan tertentu
   */
  checkAssessment = asyncHandler(async (req, res) => {
    const { noMR } = req.params;
    const { layanan_id } = req.query;
    
    if (!layanan_id) {
      throw new ApiError(400, 'layanan_id is required');
    }
    
    const assessment = await pasienService.checkAssessmentToday(
      noMR,
      parseInt(layanan_id)
    );
    
    return successResponse(
      res,
      {
        has_assessed: !!assessment,
        assessment_data: assessment,
      },
      assessment 
        ? 'Pasien sudah pernah dinilai hari ini' 
        : 'Pasien belum dinilai hari ini'
    );
  });
  
  /**
   * Get Assessment History
   * 
   * GET /api/v1/pasien/:noMR/assessment-history
   * 
   * Query params:
   * - limit: number of records (default: 10)
   */
  getAssessmentHistory = asyncHandler(async (req, res) => {
    const { noMR } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const history = await pasienService.getAssessmentHistory(noMR, limit);
    
    return successResponse(
      res,
      history,
      `Found ${history.length} assessment records`
    );
  });
}

module.exports = new PasienController();