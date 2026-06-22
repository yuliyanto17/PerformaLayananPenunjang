const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");

class AuthService {
  async loginPetugasByUsername(username) {
    // anggap username = NIP
    const nip = String(username).trim();

    const result = await db.executeLocalQuery(
      `
      SELECT 
        p.petugas_id, p.nip, p.nama_petugas, p.jabatan,
        p.layanan_id, l.layanan_name, l.layanan_code,
        p.barcode_token, p.is_active, p.is_on_duty
      FROM m_petugas p
      INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
      WHERE p.nip = @nip
    `,
      { nip }
    );

    const petugas = result.recordset[0];
    if (!petugas) throw new ApiError(404, "Petugas tidak ditemukan");
    if (!petugas.is_active) throw new ApiError(400, "Petugas tidak aktif");

    const token = jwt.sign(
      {
        petugas_id: petugas.petugas_id,
        nip: petugas.nip,
        layanan_id: petugas.layanan_id,
        barcode_token: petugas.barcode_token,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
    );

    return { token, petugas };
  }

  async me(petugasId) {
    const result = await db.executeLocalQuery(
      `
      SELECT 
        p.petugas_id, p.nip, p.nama_petugas, p.jabatan,
        p.layanan_id, l.layanan_name, l.layanan_code,
        p.barcode_token, p.is_active, p.is_on_duty
      FROM m_petugas p
      INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
      WHERE p.petugas_id = @petugasId
    `,
      { petugasId }
    );

    const petugas = result.recordset[0];
    if (!petugas) throw new ApiError(404, "Petugas tidak ditemukan");
    return petugas;
  }
}

module.exports = new AuthService();