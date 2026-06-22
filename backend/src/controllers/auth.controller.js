const authService = require("../services/auth.service");
const { successResponse } = require("../utils/response");
const { asyncHandler } = require("../middleware/errorHandler");

class AuthController {
  loginPetugas = asyncHandler(async (req, res) => {
    const { username } = req.body;
    const result = await authService.loginPetugasByUsername(username);
    return successResponse(res, result, "Login berhasil");
  });

  me = asyncHandler(async (req, res) => {
    const petugas = await authService.me(req.user.petugas_id);
    return successResponse(res, petugas, "OK");
  });
}

module.exports = new AuthController();