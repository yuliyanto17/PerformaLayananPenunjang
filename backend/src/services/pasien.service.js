// src/services/pasien.service.js

/**
 * ============================================
 * PASIEN SERVICE
 * ============================================
 * 
 * Service untuk handle operasi terkait data pasien
 * Data pasien diambil dari PRODUCTION database
 */

const db = require('../config/database');
const ApiError = require('../utils/ApiError');

class PasienService {
  
  /**
   * Search Pasien
   * 
   * Search by No MR atau Nama Pasien
   * Data dari View_PasienMasukPoli (Production DB)
   * 
   * @param {string} keyword - Search keyword
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(keyword, filters = {}) {
    try {
      let query = `
        SELECT TOP 20
          No_Reg,
          No_MR,
          Nama_Pasien,
          Tgl_Masuk,
          Tgl_Pulang,
          Medis,
          Jenis_Kelamin,
          NamaRekanan,
          KET_MASUK,
          Nama_RuangM,
          DOKTERDPJP
        FROM View_PasienMasukPoli
        WHERE (
            No_MR LIKE @keyword 
            OR Nama_Pasien LIKE @keyword
          )
      `;
      
      const params = {
        keyword: `%${keyword}%`
      };
      
      // Filter by tanggal (default: hari ini)
      if (filters.tgl_masuk) {
        query += ` AND CAST(Tgl_Masuk AS DATE) = @tgl_masuk`;
        params.tgl_masuk = filters.tgl_masuk;
      } else {
        query += ` AND CAST(Tgl_Masuk AS DATE) = CAST(GETDATE() AS DATE)`;
      }
      
      // Filter by medis (RAWAT JALAN, RAWAT INAP, dll)
      if (filters.medis) {
        query += ` AND Medis = @medis`;
        params.medis = filters.medis;
      }
      
      // Filter by KET_MASUK (PENUNJANG, dll)
      if (filters.ket_masuk) {
        query += ` AND KET_MASUK = @ket_masuk`;
        params.ket_masuk = filters.ket_masuk;
      }
      
      query += ` ORDER BY Tgl_Masuk DESC`;
      
      const result = await db.executeProductionQuery(query, params);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to search pasien', error.message);
    }
  }
  
  /**
   * Get Pasien by No MR
   * 
   * @param {string} noMR - Nomor Medical Record
   * @returns {Promise<Object>}
   */
  async getByNoMR(noMR) {
    try {
      const result = await db.executeProductionQuery(`
        SELECT TOP 1
          No_Reg,
          No_MR,
          Nama_Pasien,
          Tgl_Masuk,
          Tgl_Pulang,
          Medis,
          Jenis_Kelamin,
          NamaRekanan,
          KET_MASUK,
          Nama_RuangM,
          DOKTERDPJP,
          KET_BAYAR
        FROM View_PasienMasukPoli
        WHERE No_MR = @noMR
          AND CAST(Tgl_Masuk AS DATE) = CAST(GETDATE() AS DATE)
        ORDER BY Tgl_Masuk DESC
      `, { noMR });
      
      const pasien = result.recordset[0];
      
      if (!pasien) {
        throw new ApiError(404, 'Data pasien tidak ditemukan atau belum registrasi hari ini');
      }
      
      return pasien;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get pasien data', error.message);
    }
  }
  
  /**
   * Get Pasien by No Registrasi
   * 
   * @param {string} noReg - Nomor Registrasi
   * @returns {Promise<Object>}
   */
  async getByNoReg(noReg) {
    try {
      const result = await db.executeProductionQuery(`
        SELECT 
          No_Reg,
          No_MR,
          Nama_Pasien,
          Tgl_Masuk,
          Tgl_Pulang,
          Medis,
          Jenis_Kelamin,
          NamaRekanan,
          KET_MASUK,
          Nama_RuangM,
          DOKTERDPJP
        FROM View_PasienMasukPoli
        WHERE No_Reg = @noReg
      `, { noReg });
      
      const pasien = result.recordset[0];
      
      if (!pasien) {
        throw new ApiError(404, 'Data pasien tidak ditemukan');
      }
      
      return pasien;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get pasien data', error.message);
    }
  }
  
  /**
   * Get Pasien List for Today
   * 
   * Ambil semua pasien yang registrasi hari ini
   * 
   * @param {Object} filters - Filters
   * @returns {Promise<Array>}
   */
  async getTodayList(filters = {}) {
    try {
      let query = `
        SELECT 
          No_Reg,
          No_MR,
          Nama_Pasien,
          Tgl_Masuk,
          Medis,
          Jenis_Kelamin,
          NamaRekanan,
          KET_MASUK,
          DOKTERDPJP
        FROM View_PasienMasukPoli
        WHERE CAST(Tgl_Masuk AS DATE) = CAST(GETDATE() AS DATE)
      `;
      
      const params = {};
      
      if (filters.medis) {
        query += ` AND Medis = @medis`;
        params.medis = filters.medis;
      }
      
      if (filters.ket_masuk) {
        query += ` AND KET_MASUK = @ket_masuk`;
        params.ket_masuk = filters.ket_masuk;
      }
      
      query += ` ORDER BY Tgl_Masuk DESC`;
      
      const result = await db.executeProductionQuery(query, params);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get today pasien list', error.message);
    }
  }
  
  /**
   * Check if Pasien has been assessed today
   * 
   * Cek apakah pasien sudah pernah dinilai hari ini untuk layanan tertentu
   * 
   * @param {string} noMR - No MR
   * @param {number} layananId - Layanan ID
   * @returns {Promise<Object>}
   */
  async checkAssessmentToday(noMR, layananId) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          penilaian_id,
          penilaian_no,
          petugas_id,
          status_penilaian,
          rating_average,
          created_at
        FROM t_penilaian_header
        WHERE no_mr = @noMR
          AND layanan_id = @layananId
          AND CAST(tanggal_penilaian AS DATE) = CAST(GETDATE() AS DATE)
        ORDER BY created_at DESC
      `, { noMR, layananId });
      
      return result.recordset[0] || null;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to check assessment', error.message);
    }
  }
  
  /**
   * Get Pasien Assessment History
   * 
   * @param {string} noMR - No MR
   * @param {number} limit - Limit results
   * @returns {Promise<Array>}
   */
  async getAssessmentHistory(noMR, limit = 10) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT TOP (@limit)
          p.penilaian_id,
          p.penilaian_no,
          p.tanggal_penilaian,
          l.layanan_name,
          pt.nama_petugas,
          p.rating_average,
          p.percentage_score,
          p.kategori_kepuasan,
          p.status_penilaian
        FROM t_penilaian_header p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        LEFT JOIN m_petugas pt ON p.petugas_id = pt.petugas_id
        WHERE p.no_mr = @noMR
          AND p.status_penilaian = 'submitted'
        ORDER BY p.tanggal_penilaian DESC
      `, { noMR, limit });
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get assessment history', error.message);
    }
  }
}

module.exports = new PasienService();