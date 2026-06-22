const adminShiftService = require("../services/adminShift.service");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponse } = require("../utils/response");

class AdminShiftController {
  apply = asyncHandler(async (req, res) => {
    const { shift_date, shift_name, petugas_ids, layanan_id } = req.body;

    const effectiveLayananId =
      req.admin.role === 'SUPER_ADMIN' && layanan_id
        ? parseInt(layanan_id)
        : req.admin.layanan_id;

    const result = await adminShiftService.applyShift({
      layanan_id: effectiveLayananId,
      shift_date,
      shift_name,
      petugas_ids,
      assigned_by: req.admin.username,
    });

    return successResponse(res, result, "Shift berhasil diterapkan");
  });

  status = asyncHandler(async (req, res) => {
    const { shift_date, shift_name, layanan_id } = req.query;

    const effectiveLayananId =
      req.admin.role === 'SUPER_ADMIN' && layanan_id
        ? parseInt(layanan_id)
        : req.admin.layanan_id;

    const result = await adminShiftService.getShiftStatus({
      layanan_id: effectiveLayananId,
      shift_date,
      shift_name,
    });

    return successResponse(res, result, "OK");
  });

  endAll = asyncHandler(async (req, res) => {
    await adminShiftService.endAllShifts(req.admin.layanan_id);
    return successResponse(res, null, "Semua shift berhasil diselesaikan");
    });
}

module.exports = new AdminShiftController();