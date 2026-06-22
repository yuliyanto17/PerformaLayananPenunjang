const db = require("../config/database");
const ApiError = require("../utils/ApiError");

class AdminPenilaianService {
  async getList(adminData, filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 20;
      const offset = (page - 1) * limit;

      const params = { offset, limit };
      const where = this._buildWhere(adminData, filters, params);

      const dataQuery = `
        SELECT
          p.penilaian_id,
          p.penilaian_no,
          p.tanggal_penilaian,
          p.no_mr,
          p.nama_pasien,
          p.medis,
          p.status_penilaian,
          p.rating_average,
          p.percentage_score,
          p.kategori_kepuasan,
          p.durasi_pengisian,
          saran_table.jawaban_text AS saran,
          pt.nama_petugas,
          pt.nip,
          pt.jabatan
        FROM t_penilaian_header p
        LEFT JOIN m_petugas pt ON p.petugas_id = pt.petugas_id
        OUTER APPLY (
          SELECT TOP 1 pd.jawaban_text
          FROM t_penilaian_detail pd
          INNER JOIN m_pertanyaan pq ON pd.pertanyaan_id = pq.pertanyaan_id
          WHERE pd.penilaian_id = p.penilaian_id
            AND pq.pertanyaan_code LIKE '%_SARAN'
        ) AS saran_table
        ${where}
        ORDER BY p.tanggal_penilaian DESC, p.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM t_penilaian_header p
        ${where}
      `;

      const [dataRes, countRes] = await Promise.all([
        db.executeLocalQuery(dataQuery, params),
        db.executeLocalQuery(countQuery, params),
      ]);

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
      throw new ApiError(500, "Failed to get penilaian list", err.message);
    }
  }

  async getExportData(adminData, filters = {}) {
    try {
      const params = {};
      const where = this._buildWhere(adminData, filters, params);

      const result = await db.executeLocalQuery(
        `
        SELECT
          p.penilaian_no                                   AS [No. Penilaian],
          CONVERT(VARCHAR(10), p.tanggal_penilaian, 23)   AS [Tanggal Penilaian],
          CONVERT(VARCHAR(19), p.created_at, 120)         AS [Tanggal Input],
          p.no_mr                                          AS [No. MR],
          p.nama_pasien                                    AS [Nama Pasien],
          p.medis                                          AS [Cara Masuk],
          l.layanan_name                                   AS [Layanan],
          pt.nama_petugas                                  AS [Nama Petugas],
          pt.nip                                           AS [NIP],
          pt.jabatan                                       AS [Jabatan],
          p.rating_average                                 AS [Rating],
          p.percentage_score                               AS [Persentase (%)],
          p.kategori_kepuasan                              AS [Kategori Kepuasan],
          p.status_penilaian                               AS [Status],
          saran_table.jawaban_text                         AS [Saran]
        FROM t_penilaian_header p
        LEFT JOIN m_petugas pt          ON p.petugas_id = pt.petugas_id
        LEFT JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        OUTER APPLY (
          SELECT TOP 1 pd.jawaban_text
          FROM t_penilaian_detail pd
          INNER JOIN m_pertanyaan pq ON pd.pertanyaan_id = pq.pertanyaan_id
          WHERE pd.penilaian_id = p.penilaian_id
            AND pq.pertanyaan_code LIKE '%_SARAN'
        ) AS saran_table
        ${where}
        ORDER BY p.created_at DESC
        `,
        params
      );

      return result.recordset;
    } catch (err) {
      throw new ApiError(500, "Failed to get export data", err.message);
    }
  }

  // Helper: bangun klausa WHERE yang sama untuk getList dan getExportData
  _buildWhere(adminData, filters, params) {
    let where = ` WHERE 1=1 `;

    if (adminData.role !== 'SUPER_ADMIN') {
      where += ` AND p.layanan_id = @layanan_id `;
      params.layanan_id = adminData.layanan_id;
    } else if (filters.layanan_id && filters.layanan_id !== 'ALL') {
      where += ` AND p.layanan_id = @layanan_id `;
      params.layanan_id = parseInt(filters.layanan_id);
    }

    if (filters.status_penilaian) {
      where += ` AND p.status_penilaian = @status_penilaian `;
      params.status_penilaian = filters.status_penilaian;
    }

    if (filters.date_from) {
      where += ` AND CAST(p.created_at AS DATE) >= @date_from `;
      params.date_from = filters.date_from;
    }

    if (filters.date_to) {
      where += ` AND CAST(p.created_at AS DATE) <= @date_to `;
      params.date_to = filters.date_to;
    }

    if (filters.petugas_id) {
      where += ` AND p.petugas_id = @petugas_id `;
      params.petugas_id = filters.petugas_id;
    }

    if (filters.q) {
      where += ` AND (p.no_mr LIKE @q OR p.nama_pasien LIKE @q OR p.penilaian_no LIKE @q) `;
      params.q = `%${filters.q}%`;
    }

    return where;
  }
}

module.exports = new AdminPenilaianService();
