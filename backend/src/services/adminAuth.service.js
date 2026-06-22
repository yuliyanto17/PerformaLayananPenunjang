const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AdminAuthService {
  async login(username, password) {
    const result = await db.executeLocalQuery(
      `
      SELECT admin_id, username, password_hash, nama_admin, layanan_id, role, is_active
      FROM m_admin_user
      WHERE username = @username
    `,
      { username }
    );

    const admin = result.recordset[0];
    if (!admin) throw new ApiError(401, "Username / Password salah");
    if (!admin.is_active) throw new ApiError(400, "Admin tidak aktif");

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) throw new ApiError(401, "Username / Password salah");

    await db.executeLocalQuery(
      `UPDATE m_admin_user SET last_login_at = GETDATE(), updated_at = GETDATE() WHERE admin_id = @admin_id`,
      { admin_id: admin.admin_id }
    );

    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        username: admin.username,
        layanan_id: admin.layanan_id,
        role: admin.role,
      },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || "12h" }
    );

    return {
      token,
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        nama_admin: admin.nama_admin,
        layanan_id: admin.layanan_id,
        role: admin.role,
      },
    };
  }

  async me(admin_id) {
    const result = await db.executeLocalQuery(
      `
      SELECT admin_id, username, nama_admin, layanan_id, role, is_active, last_login_at
      FROM m_admin_user
      WHERE admin_id = @admin_id
    `,
      { admin_id }
    );
    const admin = result.recordset[0];
    if (!admin) throw new ApiError(404, "Admin tidak ditemukan");
    return admin;
  }
}

module.exports = new AdminAuthService();