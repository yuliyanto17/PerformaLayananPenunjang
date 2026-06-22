const db = require("../config/database");
const ApiError = require("../utils/ApiError");

class AdminDashboardService {
  async summary(layanan_id, date_from = null, date_to = null) {
    try {
      const params = { layanan_id };

      let dateFilter = ` AND p.tanggal_penilaian >= DATEADD(day, -30, GETDATE()) `;
      if (date_from) {
        dateFilter = ` AND p.tanggal_penilaian >= @date_from `;
        params.date_from = date_from;
      }
      if (date_to) {
        dateFilter += ` AND p.tanggal_penilaian <= @date_to `;
        params.date_to = date_to;
      }

      const res = await db.executeLocalQuery(
        `
        SELECT
          COUNT(*) AS total_penilaian,
          COUNT(DISTINCT p.no_mr) AS total_pasien_unik,
          COUNT(DISTINCT p.petugas_id) AS total_petugas_dinilai,
          AVG(p.rating_average) AS avg_rating,
          AVG(p.percentage_score) AS avg_percentage,
          SUM(CASE WHEN p.kategori_kepuasan='Sangat Puas' THEN 1 ELSE 0 END) AS sangat_puas,
          SUM(CASE WHEN p.kategori_kepuasan='Puas' THEN 1 ELSE 0 END) AS puas,
          SUM(CASE WHEN p.kategori_kepuasan='Cukup Puas' THEN 1 ELSE 0 END) AS cukup_puas,
          SUM(CASE WHEN p.kategori_kepuasan='Tidak Puas' THEN 1 ELSE 0 END) AS tidak_puas,
          SUM(CASE WHEN p.kategori_kepuasan='Sangat Tidak Puas' THEN 1 ELSE 0 END) AS sangat_tidak_puas
        FROM t_penilaian_header p
        WHERE p.layanan_id = @layanan_id
          AND p.status_penilaian = 'submitted'
          ${dateFilter}
        `,
        params
      );

      return res.recordset[0];
    } catch (err) {
      throw new ApiError(500, "Failed to get summary", err.message);
    }
  }

  async trendDaily(layanan_id, days = 30) {
    try {
      const res = await db.executeLocalQuery(
        `
        SELECT
          CAST(p.tanggal_penilaian AS DATE) AS tanggal,
          COUNT(*) AS total_penilaian,
          AVG(p.rating_average) AS avg_rating,
          AVG(p.percentage_score) AS avg_percentage
        FROM t_penilaian_header p
        WHERE p.layanan_id = @layanan_id
          AND p.status_penilaian = 'submitted'
          AND p.tanggal_penilaian >= DATEADD(day, -@days, GETDATE())
        GROUP BY CAST(p.tanggal_penilaian AS DATE)
        ORDER BY tanggal ASC
        `,
        { layanan_id, days }
      );

      return res.recordset;
    } catch (err) {
      throw new ApiError(500, "Failed to get trend", err.message);
    }
  }
}

module.exports = new AdminDashboardService();