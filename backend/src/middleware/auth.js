const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

const authPetugas = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) throw new ApiError(401, "Unauthorized: token not found");

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { petugas_id, nip, layanan_id, barcode_token }
    next();
  } catch (err) {
    throw new ApiError(401, "Unauthorized: invalid/expired token");
  }
};

module.exports = { authPetugas };