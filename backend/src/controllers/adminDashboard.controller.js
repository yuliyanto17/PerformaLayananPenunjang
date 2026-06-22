const adminDashboardService = require("../services/adminDashboard.service");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponse } = require("../utils/response");

class AdminDashboardController {
  summary = asyncHandler(async (req, res) => {
    const data = await adminDashboardService.summary(
      req.admin.layanan_id,
      req.query.date_from || null,
      req.query.date_to || null
    );
    return successResponse(res, data, "OK");
  });

  trend = asyncHandler(async (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const data = await adminDashboardService.trendDaily(req.admin.layanan_id, days);
    return successResponse(res, data, "OK");
  });
}

module.exports = new AdminDashboardController();