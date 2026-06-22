const adminPetugasService = require("../services/adminPetugas.service");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponse } = require("../utils/response");

class AdminPetugasController {
  search = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const data = await adminPetugasService.search(req.admin.layanan_id, q, limit);
    return successResponse(res, data, `Found ${data.length} petugas`);
  });

  list = asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();
    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    };

    // SUPER_ADMIN bisa kirim layanan_id via query untuk filter layanan tertentu
    const effectiveLayananId =
      req.admin.role === 'SUPER_ADMIN' && req.query.layanan_id
        ? parseInt(req.query.layanan_id)
        : req.admin.layanan_id;

    const result = await adminPetugasService.getList(effectiveLayananId, { q }, pagination);

    return res.status(200).json({
      success: true,
      message: "OK",
      data: result.data,
      pagination: result.pagination,
      statusCode: 200,
    });
  });

  toggleDuty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // SUPER_ADMIN tidak dibatasi layanan saat toggle duty
    const effectiveLayananId = req.admin.role === 'SUPER_ADMIN' ? null : req.admin.layanan_id;

    await adminPetugasService.toggleDuty(effectiveLayananId, parseInt(id), status);
    return successResponse(res, null, "Status petugas berhasil diubah");
  });
}

module.exports = new AdminPetugasController();