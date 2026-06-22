const db = require("../config/database");
const { asyncHandler } = require("../middleware/errorHandler");
const { successResponse } = require("../utils/response");

class AdminKioskController {
  // default ambil dari m_petugas.is_on_duty (realtime)
  onDutyList = asyncHandler(async (req, res) => {
    const layanan_id = req.admin.layanan_id;

    const result = await db.executeLocalQuery(
      `
      SELECT 
        p.petugas_id, p.nip, p.nama_petugas, p.jabatan,
        p.barcode_token, p.is_on_duty, p.shift_current
      FROM m_petugas p
      WHERE p.layanan_id = @layanan_id
        AND p.is_active = 1
        AND p.is_on_duty = 1
      ORDER BY p.nama_petugas
    `,
      { layanan_id }
    );

    return successResponse(res, result.recordset, "OK");
  });
}

module.exports = new AdminKioskController();