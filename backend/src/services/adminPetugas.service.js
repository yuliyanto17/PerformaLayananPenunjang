const db = require("../config/database");
const ApiError = require("../utils/ApiError");

class AdminPetugasService {
  async search(adminLayananId, keyword, limit = 20) {
    try {
      const q = String(keyword || "").trim();
      if (q.length < 2) return [];

      const result = await db.executeLocalQuery(
        `
        SELECT TOP (@limit)
          p.petugas_id,
          p.nip,
          p.nama_petugas,
          p.jabatan,
          p.layanan_id,
          l.layanan_name,
          l.layanan_code,
          p.is_on_duty
        FROM m_petugas p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        WHERE p.is_active = 1
          AND p.layanan_id = @layanan_id
          AND (p.nama_petugas LIKE @kw OR p.nip LIKE @kw)
        ORDER BY p.is_on_duty DESC, p.nama_petugas
      `,
        {
          limit,
          layanan_id: adminLayananId,
          kw: `%${q}%`,
        }
      );

      return result.recordset;
    } catch (err) {
      throw new ApiError(500, "Failed to search petugas", err.message);
    }
  }

  async getList(adminLayananId, filters = {}, pagination = {}) {
    try {
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 50;
        const offset = (page - 1) * limit;

        let where = ` WHERE p.is_active = 1 AND p.layanan_id = @layanan_id `;
        const params = { layanan_id: adminLayananId, offset, limit };

        if (filters.q) {
        where += ` AND (p.nama_petugas LIKE @q OR p.nip LIKE @q) `;
        params.q = `%${filters.q}%`;
        }

        const dataRes = await db.executeLocalQuery(
        `
        SELECT
            p.petugas_id, p.nip, p.nama_petugas, p.jabatan,
            p.is_on_duty, p.shift_current,
            l.layanan_name, l.layanan_code
        FROM m_petugas p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        ${where}
        ORDER BY p.is_on_duty DESC, p.nama_petugas
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `,
        params
        );

        const countRes = await db.executeLocalQuery(
        `
        SELECT COUNT(*) AS total
        FROM m_petugas p
        ${where}
        `,
        params
        );

        const total = countRes.recordset[0].total;

        return {
        data: dataRes.recordset,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        };
    } catch (err) {
        throw new ApiError(500, "Failed to get petugas list", err.message);
    }
    }

    async toggleDuty(adminLayananId, petugasId, status) {
        try {
                // adminLayananId = null berarti SUPER_ADMIN, skip validasi layanan
                const layananClause = adminLayananId ? ' AND layanan_id = @layanan_id' : '';
                const params = { status: status ? 1 : 0, petugas_id: petugasId };
                if (adminLayananId) params.layanan_id = adminLayananId;

                const result = await db.executeLocalQuery(
                `
                UPDATE m_petugas
                SET is_on_duty = @status, updated_at = GETDATE()
                OUTPUT INSERTED.petugas_id
                WHERE petugas_id = @petugas_id${layananClause}
                `,
                params
                );

                if (result.recordset.length === 0) {
                throw new ApiError(404, "Petugas tidak ditemukan");
                }
                return true;
            } catch (err) {
                if (err instanceof ApiError) throw err;
                throw new ApiError(500, "Gagal mengubah status petugas", err.message);
            }
        }
}



module.exports = new AdminPetugasService();