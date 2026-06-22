const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

const authAdmin = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Unauthorized");

  try {
    const payload = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    // payload minimal: { admin_id, layanan_id, username }
    req.admin = payload;
    next();
  } catch {
    throw new ApiError(401, "Unauthorized: invalid/expired token");
  }
};

module.exports = { authAdmin };