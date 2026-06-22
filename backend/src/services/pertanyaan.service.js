// src/services/pertanyaan.service.js

/**
 * ============================================
 * PERTANYAAN SERVICE
 * ============================================
 * 
 * Service untuk handle operasi terkait pertanyaan penilaian
 * Termasuk get pertanyaan dengan opsi jawaban
 */

const db = require('../config/database');
const ApiError = require('../utils/ApiError');

class PertanyaanService {
  
  /**
   * Get Pertanyaan by Layanan ID
   * 
   * Ambil semua pertanyaan untuk layanan tertentu
   * Include opsi jawaban
   * 
   * @param {number} layananId - Layanan ID
   * @returns {Promise<Array>}
   */
  async getByLayanan(layananId) {
    try {
      // Get pertanyaan
      const pertanyaanResult = await db.executeLocalQuery(`
        SELECT 
          p.pertanyaan_id,
          p.layanan_id,
          p.kategori_id,
          k.kategori_name,
          k.kategori_code,
          k.icon_name as kategori_icon,
          p.template_id,
          t.template_name,
          t.template_code,
          t.tipe_input,
          p.pertanyaan_code,
          p.pertanyaan_text,
          p.pertanyaan_subtitle,
          p.placeholder_text,
          p.has_custom_opsi,
          p.is_required,
          p.allow_comment,
          p.parent_pertanyaan_id,
          p.show_if_value,
          p.bobot,
          p.sort_order
        FROM m_pertanyaan p
        INNER JOIN m_kategori_pertanyaan k ON p.kategori_id = k.kategori_id
        INNER JOIN m_template_jawaban t ON p.template_id = t.template_id
        WHERE (p.layanan_id = @layananId OR p.layanan_id IS NULL)
          AND p.is_active = 1
          AND k.is_active = 1
          AND t.is_active = 1
        ORDER BY p.sort_order, p.pertanyaan_id
      `, { layananId });
      
      const pertanyaanList = pertanyaanResult.recordset;
      
      // Untuk setiap pertanyaan, ambil opsi jawaban
      for (let pertanyaan of pertanyaanList) {
        // Jika has_custom_opsi, ambil dari m_pertanyaan_opsi
        if (pertanyaan.has_custom_opsi) {
          const opsiResult = await db.executeLocalQuery(`
            SELECT 
              pertanyaan_opsi_id as opsi_id,
              nilai,
              label,
              emoji,
              color_hex,
              sort_order
            FROM m_pertanyaan_opsi
            WHERE pertanyaan_id = @pertanyaanId
              AND is_active = 1
            ORDER BY sort_order
          `, { pertanyaanId: pertanyaan.pertanyaan_id });
          
          pertanyaan.opsi_jawaban = opsiResult.recordset;
        } 
        // Jika tidak, ambil dari m_opsi_jawaban berdasarkan template
        else if (['rating_5', 'rating_emoji', 'rating_10', 'boolean', 'single_choice', 'multiple_choice', 'dropdown'].includes(pertanyaan.tipe_input)) {
          const opsiResult = await db.executeLocalQuery(`
            SELECT 
              opsi_id,
              nilai,
              label,
              emoji,
              color_hex,
              deskripsi,
              sort_order
            FROM m_opsi_jawaban
            WHERE template_id = @templateId
              AND is_active = 1
            ORDER BY sort_order
          `, { templateId: pertanyaan.template_id });
          
          pertanyaan.opsi_jawaban = opsiResult.recordset;
        } else {
          pertanyaan.opsi_jawaban = [];
        }
      }
      
      return pertanyaanList;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get pertanyaan', error.message);
    }
  }
  
  /**
   * Get Pertanyaan by ID
   * 
   * @param {number} id - Pertanyaan ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          p.pertanyaan_id,
          p.layanan_id,
          p.kategori_id,
          k.kategori_name,
          p.template_id,
          t.template_name,
          t.tipe_input,
          p.pertanyaan_code,
          p.pertanyaan_text,
          p.pertanyaan_subtitle,
          p.placeholder_text,
          p.has_custom_opsi,
          p.is_required,
          p.allow_comment,
          p.parent_pertanyaan_id,
          p.show_if_value,
          p.bobot,
          p.sort_order,
          p.is_active
        FROM m_pertanyaan p
        INNER JOIN m_kategori_pertanyaan k ON p.kategori_id = k.kategori_id
        INNER JOIN m_template_jawaban t ON p.template_id = t.template_id
        WHERE p.pertanyaan_id = @id
      `, { id });
      
      const pertanyaan = result.recordset[0];
      
      if (!pertanyaan) {
        throw new ApiError(404, 'Pertanyaan not found');
      }
      
      // Get opsi jawaban
      if (pertanyaan.has_custom_opsi) {
        const opsiResult = await db.executeLocalQuery(`
          SELECT * FROM m_pertanyaan_opsi
          WHERE pertanyaan_id = @id AND is_active = 1
          ORDER BY sort_order
        `, { id });
        pertanyaan.opsi_jawaban = opsiResult.recordset;
      } else {
        const opsiResult = await db.executeLocalQuery(`
          SELECT * FROM m_opsi_jawaban
          WHERE template_id = @templateId AND is_active = 1
          ORDER BY sort_order
        `, { templateId: pertanyaan.template_id });
        pertanyaan.opsi_jawaban = opsiResult.recordset;
      }
      
      return pertanyaan;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get pertanyaan', error.message);
    }
  }
  
  /**
   * Get All Pertanyaan (untuk admin)
   * 
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          p.pertanyaan_id,
          p.layanan_id,
          l.layanan_name,
          p.kategori_id,
          k.kategori_name,
          p.template_id,
          t.template_name,
          t.tipe_input,
          p.pertanyaan_code,
          p.pertanyaan_text,
          p.is_required,
          p.sort_order,
          p.is_active,
          p.created_at
        FROM m_pertanyaan p
        LEFT JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        INNER JOIN m_kategori_pertanyaan k ON p.kategori_id = k.kategori_id
        INNER JOIN m_template_jawaban t ON p.template_id = t.template_id
        WHERE 1=1
      `;
      
      const params = {};
      
      if (filters.layanan_id) {
        query += ` AND p.layanan_id = @layanan_id`;
        params.layanan_id = filters.layanan_id;
      }
      
      if (filters.kategori_id) {
        query += ` AND p.kategori_id = @kategori_id`;
        params.kategori_id = filters.kategori_id;
      }
      
      if (filters.is_active !== undefined) {
        query += ` AND p.is_active = @is_active`;
        params.is_active = filters.is_active;
      }
      
      query += ` ORDER BY p.sort_order, p.pertanyaan_id`;
      
      const result = await db.executeLocalQuery(query, params);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get pertanyaan list', error.message);
    }
  }
  
  /**
   * Create Pertanyaan
   * 
   * @param {Object} data - Pertanyaan data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      // Insert pertanyaan
      const result = await db.executeLocalQuery(`
        INSERT INTO m_pertanyaan (
          layanan_id,
          kategori_id,
          template_id,
          pertanyaan_code,
          pertanyaan_text,
          pertanyaan_subtitle,
          placeholder_text,
          has_custom_opsi,
          is_required,
          allow_comment,
          parent_pertanyaan_id,
          show_if_value,
          bobot,
          sort_order,
          created_by
        )
        OUTPUT INSERTED.*
        VALUES (
          @layanan_id,
          @kategori_id,
          @template_id,
          @pertanyaan_code,
          @pertanyaan_text,
          @pertanyaan_subtitle,
          @placeholder_text,
          @has_custom_opsi,
          @is_required,
          @allow_comment,
          @parent_pertanyaan_id,
          @show_if_value,
          @bobot,
          @sort_order,
          @created_by
        )
      `, {
        layanan_id: data.layanan_id || null,
        kategori_id: data.kategori_id,
        template_id: data.template_id,
        pertanyaan_code: data.pertanyaan_code,
        pertanyaan_text: data.pertanyaan_text,
        pertanyaan_subtitle: data.pertanyaan_subtitle || null,
        placeholder_text: data.placeholder_text || null,
        has_custom_opsi: data.has_custom_opsi || 0,
        is_required: data.is_required !== undefined ? data.is_required : 1,
        allow_comment: data.allow_comment || 0,
        parent_pertanyaan_id: data.parent_pertanyaan_id || null,
        show_if_value: data.show_if_value || null,
        bobot: data.bobot || 1,
        sort_order: data.sort_order || 0,
        created_by: data.created_by || 'system',
      });
      
      const pertanyaan = result.recordset[0];
      
      // Jika ada custom opsi, insert ke m_pertanyaan_opsi
      if (data.has_custom_opsi && data.opsi_jawaban && data.opsi_jawaban.length > 0) {
        for (let opsi of data.opsi_jawaban) {
          await db.executeLocalQuery(`
            INSERT INTO m_pertanyaan_opsi (
              pertanyaan_id, nilai, label, emoji, color_hex, sort_order
            ) VALUES (
              @pertanyaan_id, @nilai, @label, @emoji, @color_hex, @sort_order
            )
          `, {
            pertanyaan_id: pertanyaan.pertanyaan_id,
            nilai: opsi.nilai,
            label: opsi.label,
            emoji: opsi.emoji || null,
            color_hex: opsi.color_hex || null,
            sort_order: opsi.sort_order || 0,
          });
        }
      }
      
      return pertanyaan;
      
    } catch (error) {
      if (error.number === 2627 || error.number === 2601) {
        throw new ApiError(409, 'Pertanyaan code already exists');
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create pertanyaan', error.message);
    }
  }
  
  /**
   * Update Pertanyaan
   * 
   * @param {number} id - Pertanyaan ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      await this.getById(id);
      
      const result = await db.executeLocalQuery(`
        UPDATE m_pertanyaan
        SET
          pertanyaan_text = @pertanyaan_text,
          pertanyaan_subtitle = @pertanyaan_subtitle,
          placeholder_text = @placeholder_text,
          is_required = @is_required,
          allow_comment = @allow_comment,
          bobot = @bobot,
          sort_order = @sort_order,
          updated_by = @updated_by,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE pertanyaan_id = @id
      `, {
        id,
        pertanyaan_text: data.pertanyaan_text,
        pertanyaan_subtitle: data.pertanyaan_subtitle,
        placeholder_text: data.placeholder_text,
        is_required: data.is_required,
        allow_comment: data.allow_comment,
        bobot: data.bobot,
        sort_order: data.sort_order,
        updated_by: data.updated_by || 'system',
      });
      
      return result.recordset[0];
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update pertanyaan', error.message);
    }
  }
  
  /**
   * Delete Pertanyaan (Soft Delete)
   * 
   * @param {number} id - Pertanyaan ID
   */
  async delete(id) {
    try {
      await this.getById(id);
      
      await db.executeLocalQuery(`
        UPDATE m_pertanyaan
        SET is_active = 0, updated_at = GETDATE()
        WHERE pertanyaan_id = @id
      `, { id });
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete pertanyaan', error.message);
    }
  }
  
  /**
   * Get Kategori Pertanyaan
   * 
   * @returns {Promise<Array>}
   */
  async getKategori() {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          kategori_id,
          kategori_code,
          kategori_name,
          deskripsi,
          icon_name,
          color_hex,
          sort_order
        FROM m_kategori_pertanyaan
        WHERE is_active = 1
        ORDER BY sort_order
      `);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get kategori', error.message);
    }
  }
  
  /**
   * Get Template Jawaban
   * 
   * @returns {Promise<Array>}
   */
  async getTemplate() {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          template_id,
          template_code,
          template_name,
          tipe_input,
          deskripsi
        FROM m_template_jawaban
        WHERE is_active = 1
        ORDER BY template_name
      `);
      
      return result.recordset;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get template', error.message);
    }
  }
}

module.exports = new PertanyaanService();