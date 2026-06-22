// src/controllers/penilaian.controller.js

/**
 * ============================================
 * PENILAIAN CONTROLLER
 * ============================================
 * 
 * Controller untuk handle flow penilaian lengkap
 */

const penilaianService = require('../services/penilaian.service');
const { successResponse, createdResponse, successResponseWithPagination } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class PenilaianController {
  
  /**
   * Start New Penilaian
   * 
   * POST /api/v1/penilaian/start
   * 
   * Body:
   * {
   *   no_reg: "26-00141166",
   *   no_mr: "812151",
   *   nama_pasien: "FITRIYAH,NY",
   *   tgl_masuk: "2024-01-15",
   *   medis: "RAWAT JALAN",
   *   jenis_kelamin: "P",
   *   layanan_id: 1,
   *   petugas_id: 1,
   *   device_type: "mobile",
   *   session_id: "xxx"
   * }
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     penilaian_id: 1,
   *     penilaian_no: "PNL/RAD/20240115/0001",
   *     status: "draft",
   *     ...
   *   }
   * }
   */
  start = asyncHandler(async (req, res) => {
    const data = {
      ...req.body,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    };
    
    // Log event
    logger.logEvent('PENILAIAN_STARTED', {
      no_mr: data.no_mr,
      layanan_id: data.layanan_id,
      petugas_id: data.petugas_id,
    });
    
    const penilaian = await penilaianService.start(data);
    
    return createdResponse(
      res,
      penilaian,
      'Penilaian started successfully'
    );
  });
  
  /**
   * Save Answer (Auto-save)
   * 
   * PUT /api/v1/penilaian/:id/answer
   * 
   * Body:
   * {
   *   pertanyaan_id: 1,
   *   nilai_rating: 5,
   *   komentar: "optional comment",
   *   urutan_jawab: 1,
   *   durasi_jawab: 5
   * }
   */
  saveAnswer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    const answer = await penilaianService.saveAnswer(parseInt(id), data);
    
    return successResponse(
      res,
      answer,
      'Answer saved successfully'
    );
  });
  
  /**
   * Submit Penilaian
   * 
   * POST /api/v1/penilaian/:id/submit
   * 
   * Body (optional):
   * {
   *   komentar_umum: "Overall comment",
   *   saran: "Suggestions",
   *   nps_score: 9
   * }
   */
  submit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    // Log event
    logger.logEvent('PENILAIAN_SUBMITTED', {
      penilaian_id: id,
    });
    
    const penilaian = await penilaianService.submit(parseInt(id), data);
    
    return successResponse(
      res,
      penilaian,
      'Penilaian submitted successfully'
    );
  });
  
  /**
   * Get Penilaian by ID
   * 
   * GET /api/v1/penilaian/:id
   * 
   * Query params:
   * - include_details: true/false (default: true)
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const includeDetails = req.query.include_details !== 'false';
    
    const penilaian = await penilaianService.getById(parseInt(id), includeDetails);
    
    return successResponse(
      res,
      penilaian,
      'Penilaian retrieved successfully'
    );
  });
  
  /**
   * Get Penilaian List
   * 
   * GET /api/v1/penilaian
   * 
   * Query params:
   * - page: page number (default: 1)
   * - limit: items per page (default: 20)
   * - layanan_id: filter by layanan
   * - petugas_id: filter by petugas
   * - status_penilaian: filter by status
   * - tanggal_from: filter from date
   * - tanggal_to: filter to date
   * - no_mr: filter by no mr
   */
  getList = asyncHandler(async (req, res) => {
    const filters = {
      layanan_id: req.query.layanan_id ? parseInt(req.query.layanan_id) : undefined,
      petugas_id: req.query.petugas_id ? parseInt(req.query.petugas_id) : undefined,
      status_penilaian: req.query.status_penilaian,
      tanggal_from: req.query.tanggal_from,
      tanggal_to: req.query.tanggal_to,
      no_mr: req.query.no_mr,
    };
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };
    
    const result = await penilaianService.getList(filters, pagination);
    
    return successResponseWithPagination(
      res,
      result.data,
      result.pagination,
      'Penilaian list retrieved successfully'
    );
  });
  
  /**
   * Delete Penilaian (draft only)
   * 
   * DELETE /api/v1/penilaian/:id
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await penilaianService.delete(parseInt(id));
    
    return successResponse(
      res,
      null,
      'Penilaian deleted successfully'
    );
  });
  
  /**
   * Get Penilaian Summary (for dashboard)
   * 
   * GET /api/v1/penilaian/summary
   * 
   * Query params:
   * - layanan_id (optional)
   * - date_from (optional)
   * - date_to (optional)
   */
  getSummary = asyncHandler(async (req, res) => {
    // Ini nanti bisa dikembangkan untuk dashboard
    // Untuk sekarang return basic info
    
    const filters = {
      layanan_id: req.query.layanan_id ? parseInt(req.query.layanan_id) : undefined,
      tanggal_from: req.query.date_from,
      tanggal_to: req.query.date_to,
    };
    
    // Get basic count
    const result = await penilaianService.getList(filters, { page: 1, limit: 1 });
    
    return successResponse(
      res,
      {
        total_penilaian: result.pagination.total,
      },
      'Summary retrieved successfully'
    );
  });
}

module.exports = new PenilaianController();