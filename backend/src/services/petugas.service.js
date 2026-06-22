// src/services/petugas.service.js

/**
 * ============================================
 * PETUGAS SERVICE
 * ============================================
 * 
 * Service untuk handle operasi database terkait petugas
 */

const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

const JABATAN_MAP = {
  'IRM': 'Instalasi Rekam Medik',
  'PATKLINIK': 'Analis Laboratorium',
  'PATA': 'Analis Laboratorium PA',
  'RAD': 'Radiografer', // Sesuaikan dengan data di DB Anda
  'ADM': 'Admin',
};

class PetugasService {
  
  /**
   * Generate unique barcode token
   * Format: PET-{LAYANAN_CODE}-{NIP}-{HASH}
   * 
   * @param {string} nip - NIP petugas
   * @param {string} layanan_code - Kode layanan
   * @returns {string} Barcode token
   */
  generateBarcodeToken(nip, layanan_code) {
    // Generate random hash (6 characters)
    const hash = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Format: PET-RAD-123456-A1B2C3
    return `PET-${layanan_code}-${nip}-${hash}`;
  }
  
  /**
   * Get All Petugas
   * 
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          p.petugas_id,
          p.nip,
          p.nama_petugas,
          p.jabatan,
          p.layanan_id,
          l.layanan_name,
          l.layanan_code,
          p.barcode_token,
          p.qr_code_path,
          p.email,
          p.no_telp,
          p.foto_url,
          p.is_active,
          p.is_on_duty,
          p.shift_current,
          p.created_at,
          p.updated_at
        FROM m_petugas p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        WHERE 1=1
      `;
      
      const params = {};
      
      // Filter by layanan
      if (filters.layanan_id) {
        query += ` AND p.layanan_id = @layanan_id`;
        params.layanan_id = filters.layanan_id;
      }
      
      // Filter by active status
      if (filters.is_active !== undefined) {
        query += ` AND p.is_active = @is_active`;
        params.is_active = filters.is_active;
      }
      
      // Filter by on duty
      if (filters.is_on_duty !== undefined) {
        query += ` AND p.is_on_duty = @is_on_duty`;
        params.is_on_duty = filters.is_on_duty;
      }
      
      query += ` ORDER BY p.nama_petugas`;
      
      const result = await db.executeLocalQuery(query, params);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get petugas list', error.message);
    }
  }
  
  /**
   * Get Petugas by ID
   * 
   * @param {number} id - Petugas ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          p.petugas_id,
          p.nip,
          p.nama_petugas,
          p.jabatan,
          p.layanan_id,
          l.layanan_name,
          l.layanan_code,
          p.barcode_token,
          p.qr_code_path,
          p.qr_last_generated,
          p.email,
          p.no_telp,
          p.foto_url,
          p.is_active,
          p.is_on_duty,
          p.shift_current,
          p.shift_start_time,
          p.shift_end_time,
          p.created_at,
          p.updated_at
        FROM m_petugas p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        WHERE p.petugas_id = @id
      `, { id });
      
      const petugas = result.recordset[0];
      
      if (!petugas) {
        throw new ApiError(404, 'Petugas not found');
      }
      
      return petugas;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get petugas', error.message);
    }
  }
  
  /**
   * Get Petugas by Barcode Token
   * 
   * @param {string} token - Barcode token
   * @returns {Promise<Object>}
   */
  async getByBarcodeToken(token) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          p.petugas_id,
          p.nip,
          p.nama_petugas,
          p.jabatan,
          p.layanan_id,
          l.layanan_name,
          l.layanan_code,
          p.barcode_token,
          p.foto_url,
          p.is_active,
          p.is_on_duty
        FROM m_petugas p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        WHERE p.barcode_token = @token
      `, { token });
      
      const petugas = result.recordset[0];
      
      if (!petugas) {
        throw new ApiError(404, 'Barcode tidak valid atau petugas tidak ditemukan');
      }
      
      if (!petugas.is_active) {
        throw new ApiError(400, 'Petugas tidak aktif');
      }
      
      return petugas;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to validate barcode', error.message);
    }
  }
  
  /**
   * Create New Petugas
   * 
   * @param {Object} data - Petugas data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      // Get layanan code untuk generate barcode
      const layananResult = await db.executeLocalQuery(`
        SELECT layanan_code 
        FROM m_layanan_penunjang 
        WHERE layanan_id = @layanan_id
      `, { layanan_id: data.layanan_id });
      
      if (!layananResult.recordset[0]) {
        throw new ApiError(400, 'Layanan not found');
      }
      
      const layanan_code = layananResult.recordset[0].layanan_code;
      
      // Generate barcode token
      const barcode_token = this.generateBarcodeToken(data.nip, layanan_code);
      
      // Insert petugas
      const result = await db.executeLocalQuery(`
        INSERT INTO m_petugas (
          nip,
          nama_petugas,
          layanan_id,
          jabatan,
          barcode_token,
          email,
          no_telp,
          foto_url,
          is_on_duty,
          created_by
        )
        OUTPUT INSERTED.*
        VALUES (
          @nip,
          @nama_petugas,
          @layanan_id,
          @jabatan,
          @barcode_token,
          @email,
          @no_telp,
          @foto_url,
          @is_on_duty,
          @created_by
        )
      `, {
        nip: data.nip,
        nama_petugas: data.nama_petugas,
        layanan_id: data.layanan_id,
        jabatan: data.jabatan || null,
        barcode_token,
        email: data.email || null,
        no_telp: data.no_telp || null,
        foto_url: data.foto_url || null,
        is_on_duty: data.is_on_duty || 0,
        created_by: data.created_by || 'system',
      });
      
      return result.recordset[0];
      
    } catch (error) {
      // Check duplicate NIP
      if (error.number === 2627 || error.number === 2601) {
        throw new ApiError(409, 'NIP already exists');
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create petugas', error.message);
    }
  }
  
  /**
   * Update Petugas
   * 
   * @param {number} id - Petugas ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      // Check if exists
      await this.getById(id);
      
      const result = await db.executeLocalQuery(`
        UPDATE m_petugas
        SET
          nama_petugas = @nama_petugas,
          jabatan = @jabatan,
          email = @email,
          no_telp = @no_telp,
          foto_url = @foto_url,
          is_on_duty = @is_on_duty,
          shift_current = @shift_current,
          updated_by = @updated_by,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE petugas_id = @id
      `, {
        id,
        nama_petugas: data.nama_petugas,
        jabatan: data.jabatan,
        email: data.email,
        no_telp: data.no_telp,
        foto_url: data.foto_url,
        is_on_duty: data.is_on_duty,
        shift_current: data.shift_current,
        updated_by: data.updated_by || 'system',
      });
      
      return result.recordset[0];
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update petugas', error.message);
    }
  }
  
  /**
   * Delete Petugas (Soft Delete)
   * 
   * @param {number} id - Petugas ID
   */
  async delete(id) {
    try {
      await this.getById(id);
      
      await db.executeLocalQuery(`
        UPDATE m_petugas
        SET 
          is_active = 0,
          updated_at = GETDATE()
        WHERE petugas_id = @id
      `, { id });
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete petugas', error.message);
    }
  }
  
  /**
   * Toggle On Duty Status
   * 
   * @param {number} id - Petugas ID
   * @param {boolean} status - On duty status
   * @returns {Promise<Object>}
   */
  async toggleOnDuty(id, status) {
    try {
      const result = await db.executeLocalQuery(`
        UPDATE m_petugas
        SET 
          is_on_duty = @status,
          updated_at = GETDATE()
        OUTPUT INSERTED.petugas_id, INSERTED.nama_petugas, INSERTED.is_on_duty
        WHERE petugas_id = @id AND is_active = 1
      `, { id, status });
      
      if (!result.recordset[0]) {
        throw new ApiError(404, 'Petugas not found or inactive');
      }
      
      return result.recordset[0];
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to toggle on duty status', error.message);
    }
  }
  
  /**
   * Get Petugas Statistics
   * 
   * @param {number} id - Petugas ID
   * @param {Object} dateRange - Date range for stats
   * @returns {Promise<Object>}
   */
  async getStatistics(id, dateRange = {}) {
    try {
      let dateFilter = '';
      const params = { id };
      
      if (dateRange.start_date && dateRange.end_date) {
        dateFilter = `
          AND p.tanggal_penilaian >= @start_date 
          AND p.tanggal_penilaian <= @end_date
        `;
        params.start_date = dateRange.start_date;
        params.end_date = dateRange.end_date;
      } else {
        // Default: last 30 days
        dateFilter = `AND p.tanggal_penilaian >= DATEADD(day, -30, GETDATE())`;
      }
      
      const result = await db.executeLocalQuery(`
        SELECT 
          COUNT(p.penilaian_id) as total_penilaian,
          COUNT(DISTINCT p.no_mr) as total_pasien,
          AVG(p.rating_average) as avg_rating,
          AVG(p.percentage_score) as avg_percentage,
          
          SUM(CASE WHEN p.kategori_kepuasan = 'Sangat Puas' THEN 1 ELSE 0 END) as total_sangat_puas,
          SUM(CASE WHEN p.kategori_kepuasan = 'Puas' THEN 1 ELSE 0 END) as total_puas,
          SUM(CASE WHEN p.kategori_kepuasan = 'Cukup Puas' THEN 1 ELSE 0 END) as total_cukup_puas,
          SUM(CASE WHEN p.kategori_kepuasan = 'Tidak Puas' THEN 1 ELSE 0 END) as total_tidak_puas,
          SUM(CASE WHEN p.kategori_kepuasan = 'Sangat Tidak Puas' THEN 1 ELSE 0 END) as total_sangat_tidak_puas,
          
          MAX(p.tanggal_penilaian) as last_penilaian_date,
          MIN(p.tanggal_penilaian) as first_penilaian_date
          
        FROM t_penilaian_header p
        WHERE p.petugas_id = @id 
          AND p.status_penilaian = 'submitted'
          ${dateFilter}
      `, params);
      
      return result.recordset[0];
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get petugas statistics', error.message);
    }
  }


    async getFilteredPetugas(layananId, layananCode) {
        try {
            const jabatan = JABATAN_MAP[layananCode];
            
            // Jika layanan tidak ada di map, ambil semua petugas layanan tsb (default)
            if (!jabatan) {
            const res = await db.executeLocalQuery(`
                SELECT petugas_id, nama_petugas, nip, jabatan, foto_url 
                FROM m_petugas WHERE is_active = 1 AND layanan_id = @layanan_id
            `, { layanan_id: layananId });
            return res.recordset;
            }

            // Jika ada di map, filter by jabatan
            const res = await db.executeLocalQuery(`
            SELECT petugas_id, nama_petugas, nip, jabatan, foto_url 
            FROM m_petugas 
            WHERE is_active = 1 
                AND layanan_id = @layanan_id 
                AND jabatan = @jabatan
            `, { layanan_id: layananId, jabatan: jabatan });
            
            return res.recordset;
        } catch (err) {
            throw new ApiError(500, "Gagal memuat petugas", err.message);
        }
    }
}

module.exports = new PetugasService();