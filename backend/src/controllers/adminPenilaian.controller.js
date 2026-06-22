const adminPenilaianService = require("../services/adminPenilaian.service");
const penilaianService = require("../services/penilaian.service");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponseWithPagination, successResponse } = require("../utils/response");
const ApiError = require("../utils/ApiError");

class AdminPenilaianController {
  getList = asyncHandler(async (req, res) => {
    const filters = {
      status_penilaian: req.query.status_penilaian || "",
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      petugas_id: req.query.petugas_id ? parseInt(req.query.petugas_id) : undefined,
      layanan_id: req.query.layanan_id,
      q: req.query.q,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    };

    const result = await adminPenilaianService.getList(
      req.admin,
      filters,
      pagination
    );

    return successResponseWithPagination(res, result.data, result.pagination, "OK");
  });

  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const penilaian = await penilaianService.getById(parseInt(id), true);

    // SUPER_ADMIN bisa lihat semua; ADMIN_LAYANAN hanya layanan miliknya
    if (req.admin.role !== 'SUPER_ADMIN' && penilaian.layanan_id !== req.admin.layanan_id) {
      throw new ApiError(403, "Anda tidak memiliki akses ke data ini");
    }

    return successResponse(res, penilaian, "OK");
  });

  exportExcel = asyncHandler(async (req, res) => {
    const filters = {
      status_penilaian: req.query.status_penilaian || "",
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      layanan_id: req.query.layanan_id,
      q: req.query.q,
    };

    const data = await adminPenilaianService.getExportData(req.admin, filters);
    return successResponse(res, data, `${data.length} data siap diexport`);
  });
}

module.exports = new AdminPenilaianController();