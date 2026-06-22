// src/services/layanan.service.js

/**
 * ============================================
 * LAYANAN SERVICE
 * ============================================
 * 
 * Service untuk handle operasi database terkait layanan penunjang
 * Semua query SQL untuk layanan ada di sini
 */

const db = require('../config/database');
const ApiError = require('../utils/ApiError');

class LayananService {
  
  /**
   * Get All Layanan (Active)
   * 
   * @returns {Promise<Array>} Array of layanan
   */
  async getAll() {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          layanan_id,
          layanan_code,
          layanan_name,
          deskripsi,
          icon_name,
          color_hex,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM m_layanan_penunjang
        WHERE is_active = 1
        ORDER BY sort_order, layanan_name
      `);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get layanan list', error.message);
    }
  }
  
  /**
   * Get Layanan by ID
   * 
   * @param {number} id - Layanan ID
   * @returns {Promise<Object>} Layanan object
   */
  async getById(id) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          layanan_id,
          layanan_code,
          layanan_name,
          deskripsi,
          icon_name,
          color_hex,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM m_layanan_penunjang
        WHERE layanan_id = @id
      `, { id });
      
      const layanan = result.recordset[0];
      
      if (!layanan) {
        throw new ApiError(404, 'Layanan not found');
      }
      
      return layanan;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get layanan', error.message);
    }
  }
  
  /**
   * Get Layanan with Statistics
   * 
   * Mendapatkan layanan beserta statistik penilaian
   * 
   * @param {number} id - Layanan ID
   * @returns {Promise<Object>}
   */
  async getWithStats(id) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          l.layanan_id,
          l.layanan_code,
          l.layanan_name,
          l.deskripsi,
          l.icon_name,
          l.color_hex,
          
          -- Statistics
          COUNT(DISTINCT p.penilaian_id) as total_penilaian,
          COUNT(DISTINCT p.petugas_id) as total_petugas,
          COUNT(DISTINCT p.no_mr) as total_pasien,
          AVG(p.rating_average) as avg_rating,
          AVG(p.percentage_score) as avg_percentage,
          MAX(p.tanggal_penilaian) as last_penilaian_date
          
        FROM m_layanan_penunjang l
        LEFT JOIN t_penilaian_header p 
          ON l.layanan_id = p.layanan_id 
          AND p.status_penilaian = 'submitted'
          AND p.tanggal_penilaian >= DATEADD(month, -1, GETDATE())
        WHERE l.layanan_id = @id
        GROUP BY 
          l.layanan_id, l.layanan_code, l.layanan_name,
          l.deskripsi, l.icon_name, l.color_hex
      `, { id });
      
      const layanan = result.recordset[0];
      
      if (!layanan) {
        throw new ApiError(404, 'Layanan not found');
      }
      
      return layanan;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get layanan with stats', error.message);
    }
  }
  
  /**
   * Create New Layanan
   * 
   * @param {Object} data - Layanan data
   * @returns {Promise<Object>} Created layanan
   */
  async create(data) {
    try {
      const result = await db.executeLocalQuery(`
        INSERT INTO m_layanan_penunjang (
          layanan_code,
          layanan_name,
          deskripsi,
          icon_name,
          color_hex,
          sort_order,
          created_by
        )
        OUTPUT INSERTED.*
        VALUES (
          @layanan_code,
          @layanan_name,
          @deskripsi,
          @icon_name,
          @color_hex,
          @sort_order,
          @created_by
        )
      `, {
        layanan_code: data.layanan_code,
        layanan_name: data.layanan_name,
        deskripsi: data.deskripsi || null,
        icon_name: data.icon_name || null,
        color_hex: data.color_hex || '#3b82f6',
        sort_order: data.sort_order || 0,
        created_by: data.created_by || 'system',
      });
      
      return result.recordset[0];
      
    } catch (error) {
      // Check duplicate key error
      if (error.number === 2627 || error.number === 2601) {
        throw new ApiError(409, 'Layanan code already exists');
      }
      throw new ApiError(500, 'Failed to create layanan', error.message);
    }
  }
  
  /**
   * Update Layanan
   * 
   * @param {number} id - Layanan ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated layanan
   */
  async update(id, data) {
    try {
      // Check if exists
      await this.getById(id);
      
      const result = await db.executeLocalQuery(`
        UPDATE m_layanan_penunjang
        SET
          layanan_name = @layanan_name,
          deskripsi = @deskripsi,
          icon_name = @icon_name,
          color_hex = @color_hex,
          sort_order = @sort_order,
          updated_by = @updated_by,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE layanan_id = @id
      `, {
        id,
        layanan_name: data.layanan_name,
        deskripsi: data.deskripsi,
        icon_name: data.icon_name,
        color_hex: data.color_hex,
        sort_order: data.sort_order,
        updated_by: data.updated_by || 'system',
      });
      
      return result.recordset[0];
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update layanan', error.message);
    }
  }
  
  /**
   * Delete Layanan (Soft Delete)
   * 
   * @param {number} id - Layanan ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      // Check if exists
      await this.getById(id);
      
      // Soft delete (set is_active = 0)
      await db.executeLocalQuery(`
        UPDATE m_layanan_penunjang
        SET 
          is_active = 0,
          updated_at = GETDATE()
        WHERE layanan_id = @id
      `, { id });
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete layanan', error.message);
    }
  }
  
  /**
   * Check if Layanan Code exists
   * 
   * @param {string} code - Layanan code
   * @param {number} excludeId - ID to exclude (untuk update)
   * @returns {Promise<boolean>}
   */
  async isCodeExists(code, excludeId = null) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM m_layanan_penunjang
        WHERE layanan_code = @code
      `;
      
      const params = { code };
      
      if (excludeId) {
        query += ` AND layanan_id != @excludeId`;
        params.excludeId = excludeId;
      }
      
      const result = await db.executeLocalQuery(query, params);
      
      return result.recordset[0].count > 0;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to check layanan code', error.message);
    }
  }
}

// Export singleton instance
module.exports = new LayananService();