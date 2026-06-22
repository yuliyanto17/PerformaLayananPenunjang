const adminAuthService = require("../services/adminAuth.service");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponse } = require("../utils/response");

class AdminAuthController {
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const data = await adminAuthService.login(username, password);
    return successResponse(res, data, "Login berhasil");
  });

  me = asyncHandler(async (req, res) => {
    const data = await adminAuthService.me(req.admin.admin_id);
    return successResponse(res, data, "OK");
  });
}

module.exports = new AdminAuthController();