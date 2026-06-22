// src/services/penilaian.service.js

/**
 * ============================================
 * PENILAIAN SERVICE
 * ============================================
 * 
 * Service untuk handle operasi penilaian
 * Ini adalah service paling complex karena handle:
 * - Create penilaian (draft)
 * - Save jawaban (auto-save)
 * - Calculate scoring
 * - Submit penilaian
 */

const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const moment = require('moment');

class PenilaianService {
  
  /**
   * Generate Penilaian Number
   * Format: PNL/{LAYANAN_CODE}/{YYYYMMDD}/{SEQ}
   * Example: PNL/RAD/20240115/0001
   * 
   * @param {string} layananCode - Layanan code
   * @returns {Promise<string>}
   */
  async generatePenilaianNo(layananCode, transaction = null) {
    try {
      const today = moment().format('YYYYMMDD');
      const prefix = `PNL/${layananCode}/${today}`;

      let result;
      if (transaction) {
        // Use UPDLOCK + HOLDLOCK so the lock is held until the transaction commits,
        // preventing concurrent requests from reading the same sequence number.
        const request = transaction.request();
        request.input('prefix', prefix);
        result = await request.query(`
          SELECT TOP 1 penilaian_no
          FROM t_penilaian_header WITH (UPDLOCK, HOLDLOCK)
          WHERE penilaian_no LIKE @prefix + '%'
          ORDER BY penilaian_no DESC
        `);
      } else {
        result = await db.executeLocalQuery(`
          SELECT TOP 1 penilaian_no
          FROM t_penilaian_header
          WHERE penilaian_no LIKE @prefix + '%'
          ORDER BY penilaian_no DESC
        `, { prefix });
      }

      let sequence = 1;

      if (result.recordset[0]) {
        const lastNo = result.recordset[0].penilaian_no;
        const lastSeq = parseInt(lastNo.split('/').pop());
        sequence = lastSeq + 1;
      }

      // Format: PNL/RAD/20240115/0001
      const penilaianNo = `${prefix}/${sequence.toString().padStart(4, '0')}`;

      return penilaianNo;

    } catch (error) {
      throw new ApiError(500, 'Failed to generate penilaian number', error.message);
    }
  }
  
  /**
   * Start New Penilaian
   * 
   * Create draft penilaian header
   * 
   * @param {Object} data - Penilaian data
   * @returns {Promise<Object>}
   */
  async start(data) {
    try {
      // Get layanan code (safe to do outside transaction)
      const layananResult = await db.executeLocalQuery(`
        SELECT layanan_code FROM m_layanan_penunjang WHERE layanan_id = @id
      `, { id: data.layanan_id });

      if (!layananResult.recordset[0]) {
        throw new ApiError(400, 'Layanan not found');
      }

      const layananCode = layananResult.recordset[0].layanan_code;

      // Count total pertanyaan (safe to do outside transaction)
      const countResult = await db.executeLocalQuery(`
        SELECT COUNT(*) as total
        FROM m_pertanyaan
        WHERE (layanan_id = @layanan_id OR layanan_id IS NULL)
          AND is_active = 1
      `, { layanan_id: data.layanan_id });

      const totalPertanyaan = countResult.recordset[0].total;

      // Generate number and insert inside a single transaction to prevent
      // race conditions that cause duplicate penilaian_no values.
      const penilaian = await db.executeTransaction(async (transaction) => {
        const penilaianNo = await this.generatePenilaianNo(layananCode, transaction);

        const request = transaction.request();
        request.input('penilaian_no', penilaianNo);
        request.input('no_reg', data.no_reg);
        request.input('no_mr', data.no_mr);
        request.input('nama_pasien', data.nama_pasien);
        request.input('tgl_masuk', data.tgl_masuk || null);
        request.input('medis', data.medis || null);
        request.input('jenis_kelamin', data.jenis_kelamin || null);
        request.input('nama_rekanan', data.nama_rekanan || null);
        request.input('layanan_id', data.layanan_id);
        request.input('petugas_id', data.petugas_id);
        request.input('total_pertanyaan', totalPertanyaan);
        request.input('device_type', data.device_type || null);
        request.input('browser_name', data.browser_name || null);
        request.input('browser_version', data.browser_version || null);
        request.input('os_name', data.os_name || null);
        request.input('screen_size', data.screen_size || null);
        request.input('ip_address', data.ip_address || null);
        request.input('user_agent', data.user_agent || null);
        request.input('session_id', data.session_id || null);

        const result = await request.query(`
          INSERT INTO t_penilaian_header (
            penilaian_no,
            no_reg,
            no_mr,
            nama_pasien,
            tgl_masuk,
            medis,
            jenis_kelamin,
            nama_rekanan,
            layanan_id,
            petugas_id,
            tanggal_penilaian,
            waktu_mulai,
            total_pertanyaan,
            device_type,
            browser_name,
            browser_version,
            os_name,
            screen_size,
            ip_address,
            user_agent,
            session_id,
            status_penilaian
          )
          OUTPUT INSERTED.*
          VALUES (
            @penilaian_no,
            @no_reg,
            @no_mr,
            @nama_pasien,
            @tgl_masuk,
            @medis,
            @jenis_kelamin,
            @nama_rekanan,
            @layanan_id,
            @petugas_id,
            CAST(GETDATE() AS DATE),
            GETDATE(),
            @total_pertanyaan,
            @device_type,
            @browser_name,
            @browser_version,
            @os_name,
            @screen_size,
            @ip_address,
            @user_agent,
            @session_id,
            'draft'
          )
        `);

        return result.recordset[0];
      });

      return penilaian;

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to start penilaian', error.message);
    }
  }
  
  /**
   * Save Answer (Auto-save)
   * 
   * Save atau update jawaban untuk pertanyaan tertentu
   * 
   * @param {number} penilaianId - Penilaian ID
   * @param {Object} data - Answer data
   * @returns {Promise<Object>}
   */
  async saveAnswer(penilaianId, data) {
    try {
      // Check if penilaian exists dan masih draft
      const penilaianResult = await db.executeLocalQuery(`
        SELECT penilaian_id, status_penilaian
        FROM t_penilaian_header
        WHERE penilaian_id = @penilaianId
      `, { penilaianId });
      
      if (!penilaianResult.recordset[0]) {
        throw new ApiError(404, 'Penilaian not found');
      }
      
      if (penilaianResult.recordset[0].status_penilaian !== 'draft') {
        throw new ApiError(400, 'Cannot edit submitted penilaian');
      }
      
      // Check if answer already exists
      const existingResult = await db.executeLocalQuery(`
        SELECT detail_id
        FROM t_penilaian_detail
        WHERE penilaian_id = @penilaianId
          AND pertanyaan_id = @pertanyaan_id
      `, {
        penilaianId,
        pertanyaan_id: data.pertanyaan_id,
      });
      
      let result;
      
      if (existingResult.recordset[0]) {
        // Update existing answer
        result = await db.executeLocalQuery(`
          UPDATE t_penilaian_detail
          SET
            nilai_rating = @nilai_rating,
            jawaban_text = @jawaban_text,
            jawaban_boolean = @jawaban_boolean,
            jawaban_pilihan = @jawaban_pilihan,
            komentar = @komentar,
            is_answered = 1,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE penilaian_id = @penilaianId
            AND pertanyaan_id = @pertanyaan_id
        `, {
          penilaianId,
          pertanyaan_id: data.pertanyaan_id,
          nilai_rating: data.nilai_rating || null,
          jawaban_text: data.jawaban_text || null,
          jawaban_boolean: data.jawaban_boolean !== undefined ? data.jawaban_boolean : null,
          jawaban_pilihan: data.jawaban_pilihan || null,
          komentar: data.komentar || null,
        });
      } else {
        // Insert new answer
        result = await db.executeLocalQuery(`
          INSERT INTO t_penilaian_detail (
            penilaian_id,
            pertanyaan_id,
            nilai_rating,
            jawaban_text,
            jawaban_boolean,
            jawaban_pilihan,
            komentar,
            urutan_jawab,
            durasi_jawab,
            is_answered
          )
          OUTPUT INSERTED.*
          VALUES (
            @penilaianId,
            @pertanyaan_id,
            @nilai_rating,
            @jawaban_text,
            @jawaban_boolean,
            @jawaban_pilihan,
            @komentar,
            @urutan_jawab,
            @durasi_jawab,
            1
          )
        `, {
          penilaianId,
          pertanyaan_id: data.pertanyaan_id,
          nilai_rating: data.nilai_rating || null,
          jawaban_text: data.jawaban_text || null,
          jawaban_boolean: data.jawaban_boolean !== undefined ? data.jawaban_boolean : null,
          jawaban_pilihan: data.jawaban_pilihan || null,
          komentar: data.komentar || null,
          urutan_jawab: data.urutan_jawab || null,
          durasi_jawab: data.durasi_jawab || null,
        });
      }
      
      // Update progress
      await this.updateProgress(penilaianId);
      
      return result.recordset[0];
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to save answer', error.message);
    }
  }
  
  /**
   * Update Progress
   * 
   * Update total_terjawab dan progress_percentage
   * 
   * @param {number} penilaianId - Penilaian ID
   */
  async updateProgress(penilaianId) {
    try {
      await db.executeLocalQuery(`
        UPDATE t_penilaian_header
        SET
          total_terjawab = (
            SELECT COUNT(*) 
            FROM t_penilaian_detail 
            WHERE penilaian_id = @penilaianId 
              AND is_answered = 1
          ),
          progress_percentage = (
            SELECT 
              CASE 
                WHEN total_pertanyaan > 0 
                THEN (CAST(COUNT(*) AS DECIMAL) / total_pertanyaan) * 100 
                ELSE 0 
              END
            FROM t_penilaian_detail 
            WHERE penilaian_id = @penilaianId 
              AND is_answered = 1
          ),
          updated_at = GETDATE()
        WHERE penilaian_id = @penilaianId
      `, { penilaianId });
      
    } catch (error) {
      throw new ApiError(500, 'Failed to update progress', error.message);
    }
  }
  
  /**
   * Calculate Score
   * 
   * Hitung total score dan rating average
   * 
   * @param {number} penilaianId - Penilaian ID
   * @returns {Promise<Object>}
   */
  async calculateScore(penilaianId) {
  try {
    /**
     * Ambil jawaban yang memiliki nilai_rating
     * + ambil max_value dari opsi jawaban (template/custom)
     * + skip pertanyaan bobot <= 0 (informasi)
     */
    const result = await db.executeLocalQuery(`
      SELECT 
        pd.nilai_rating,
        ISNULL(p.bobot, 1) AS bobot,
        t.tipe_input,
        p.has_custom_opsi,

        -- max_value diambil dari custom opsi jika ada, kalau tidak dari template opsi
        COALESCE(customMax.max_value, templateMax.max_value) AS max_value
      FROM t_penilaian_detail pd
      INNER JOIN m_pertanyaan p ON pd.pertanyaan_id = p.pertanyaan_id
      INNER JOIN m_template_jawaban t ON p.template_id = t.template_id

      OUTER APPLY (
        SELECT MAX(o.nilai) AS max_value
        FROM m_pertanyaan_opsi o
        WHERE o.pertanyaan_id = p.pertanyaan_id
          AND o.is_active = 1
      ) customMax

      OUTER APPLY (
        SELECT MAX(o.nilai) AS max_value
        FROM m_opsi_jawaban o
        WHERE o.template_id = p.template_id
          AND o.is_active = 1
      ) templateMax

      WHERE pd.penilaian_id = @penilaianId
        AND pd.is_answered = 1
        AND pd.nilai_rating IS NOT NULL
        AND ISNULL(p.bobot, 1) > 0
    `, { penilaianId });

    const answers = result.recordset;

    if (answers.length === 0) {
      return {
        total_score: 0,
        max_possible_score: 0,
        percentage_score: 0,
        rating_average: 0,
        kategori_kepuasan: 'Sangat Tidak Puas',
      };
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    // rating_average kita normalkan ke skala 1..5 agar konsisten
    let totalRatingNormalizedTo5 = 0;
    let ratingCount = 0;

    for (const answer of answers) {
      const bobot = answer.bobot || 1;

      // maxValue dari DB (opsi). Kalau tidak ada, fallback by tipe_input.
      let maxValue = Number(answer.max_value);

      if (!maxValue || maxValue <= 0) {
        // fallback untuk tipe yang tidak punya opsi di DB
        if (answer.tipe_input === 'rating_10') maxValue = 10;
        else if (answer.tipe_input === 'rating_5' || answer.tipe_input === 'rating_emoji') maxValue = 5;
        else if (answer.tipe_input === 'dropdown') maxValue = 4; // sesuai standar dropdown kepuasan Anda
        else maxValue = 5;
      }

      // Clamp nilai_rating supaya tidak melewati range
      const nilai = Math.min(Math.max(Number(answer.nilai_rating), 0), maxValue);

      totalScore += nilai * bobot;
      maxPossibleScore += maxValue * bobot;

      // Normalisasi rating ke 5 (untuk averaging)
      const normalizedTo5 = maxValue > 0 ? (nilai / maxValue) * 5 : 0;
      totalRatingNormalizedTo5 += normalizedTo5;
      ratingCount += 1;
    }

    const percentageScore = maxPossibleScore > 0
      ? (totalScore / maxPossibleScore) * 100
      : 0;

    const ratingAverage = ratingCount > 0
      ? totalRatingNormalizedTo5 / ratingCount
      : 0;

    // kategori kepuasan dari % (boleh tetap seperti ini)
    let kategoriKepuasan = '';
    if (percentageScore >= 90) kategoriKepuasan = 'Sangat Puas';
    else if (percentageScore >= 75) kategoriKepuasan = 'Puas';
    else if (percentageScore >= 60) kategoriKepuasan = 'Cukup Puas';
    else if (percentageScore >= 40) kategoriKepuasan = 'Tidak Puas';
    else kategoriKepuasan = 'Sangat Tidak Puas';

    return {
      total_score: parseFloat(totalScore.toFixed(2)),
      max_possible_score: parseFloat(maxPossibleScore.toFixed(2)),
      percentage_score: parseFloat(percentageScore.toFixed(2)),
      rating_average: parseFloat(ratingAverage.toFixed(2)),
      kategori_kepuasan: kategoriKepuasan,
    };
  } catch (error) {
    throw new ApiError(500, 'Failed to calculate score', error.message);
  }
}
  
  /**
   * Submit Penilaian
   * 
   * Finalize penilaian dan calculate final score
   * 
   * @param {number} penilaianId - Penilaian ID
   * @param {Object} data - Additional data (komentar_umum, saran)
   * @returns {Promise<Object>}
   */
  async submit(penilaianId, data = {}) {
    try {
      // Check if exists dan masih draft
      const penilaianResult = await db.executeLocalQuery(`
        SELECT 
          penilaian_id,
          status_penilaian,
          total_pertanyaan,
          total_terjawab,
          waktu_mulai
        FROM t_penilaian_header
        WHERE penilaian_id = @penilaianId
      `, { penilaianId });
      
      const penilaian = penilaianResult.recordset[0];
      
      if (!penilaian) {
        throw new ApiError(404, 'Penilaian not found');
      }
      
      if (penilaian.status_penilaian !== 'draft') {
        throw new ApiError(400, 'Penilaian already submitted');
      }
      
      // Check if all required questions answered — scoped to this penilaian's layanan only.
      // Without the layanan filter, the query would count required questions from ALL layanan,
      // causing the check to fail even when all questions for the current layanan are answered.
      const requiredResult = await db.executeLocalQuery(`
        SELECT COUNT(*) as count
        FROM m_pertanyaan p
        WHERE p.is_active = 1
          AND p.is_required = 1
          AND (
            p.layanan_id = (SELECT layanan_id FROM t_penilaian_header WHERE penilaian_id = @penilaianId)
            OR p.layanan_id IS NULL
          )
          AND p.pertanyaan_id NOT IN (
            SELECT pertanyaan_id
            FROM t_penilaian_detail
            WHERE penilaian_id = @penilaianId
              AND is_answered = 1
          )
      `, { penilaianId });
      
      const unansweredRequired = requiredResult.recordset[0].count;
      
      if (unansweredRequired > 0) {
        throw new ApiError(400, `Masih ada ${unansweredRequired} pertanyaan wajib yang belum dijawab`);
      }
      
      // Calculate score
      const scoreData = await this.calculateScore(penilaianId);
      
      // Calculate duration (dalam detik)
      const waktuMulai = moment(penilaian.waktu_mulai);
      const waktuSelesai = moment();
      const durasiPengisian = waktuSelesai.diff(waktuMulai, 'seconds');
      
      // Update header dengan final data
      const result = await db.executeLocalQuery(`
        UPDATE t_penilaian_header
        SET
          status_penilaian = 'submitted',
          waktu_selesai = GETDATE(),
          durasi_pengisian = @durasi_pengisian,
          total_score = @total_score,
          max_possible_score = @max_possible_score,
          percentage_score = @percentage_score,
          rating_average = @rating_average,
          kategori_kepuasan = @kategori_kepuasan,
          nps_score = @nps_score,
          komentar_umum = @komentar_umum,
          saran = @saran,
          submitted_at = GETDATE(),
          submitted_by = @submitted_by,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE penilaian_id = @penilaianId
      `, {
        penilaianId,
        durasi_pengisian: durasiPengisian,
        total_score: scoreData.total_score,
        max_possible_score: scoreData.max_possible_score,
        percentage_score: scoreData.percentage_score,
        rating_average: scoreData.rating_average,
        kategori_kepuasan: scoreData.kategori_kepuasan,
        nps_score: data.nps_score || null,
        komentar_umum: data.komentar_umum || null,
        saran: data.saran || null,
        submitted_by: data.submitted_by || 'pasien',
      });
      
      return result.recordset[0];
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to submit penilaian', error.message);
    }
  }
  
  /**
   * Get Penilaian by ID
   * 
   * @param {number} id - Penilaian ID
   * @param {boolean} includeDetails - Include jawaban details
   * @returns {Promise<Object>}
   */
  async getById(id, includeDetails = true) {
    try {
      const result = await db.executeLocalQuery(`
        SELECT 
          p.*,
          l.layanan_name,
          l.layanan_code,
          pt.nama_petugas,
          pt.nip,
          pt.jabatan
        FROM t_penilaian_header p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        LEFT JOIN m_petugas pt ON p.petugas_id = pt.petugas_id
        WHERE p.penilaian_id = @id
      `, { id });
      
      const penilaian = result.recordset[0];
      
      if (!penilaian) {
        throw new ApiError(404, 'Penilaian not found');
      }
      
      // Get details if requested
      if (includeDetails) {
        const detailResult = await db.executeLocalQuery(`
          SELECT 
            pd.*,
            p.pertanyaan_text,
            p.pertanyaan_code,
            k.kategori_name,
            t.tipe_input
          FROM t_penilaian_detail pd
          INNER JOIN m_pertanyaan p ON pd.pertanyaan_id = p.pertanyaan_id
          INNER JOIN m_kategori_pertanyaan k ON p.kategori_id = k.kategori_id
          INNER JOIN m_template_jawaban t ON p.template_id = t.template_id
          WHERE pd.penilaian_id = @id
          ORDER BY pd.urutan_jawab, pd.detail_id
        `, { id });
        
        penilaian.details = detailResult.recordset;
      }
      
      return penilaian;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get penilaian', error.message);
    }
  }
  
  /**
   * Get Penilaian List
   * 
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getList(filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 20;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          p.penilaian_id,
          p.penilaian_no,
          p.no_mr,
          p.nama_pasien,
          p.tanggal_penilaian,
          p.status_penilaian,
          p.rating_average,
          p.percentage_score,
          p.kategori_kepuasan,
          l.layanan_name,
          pt.nama_petugas,
          p.created_at
        FROM t_penilaian_header p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        LEFT JOIN m_petugas pt ON p.petugas_id = pt.petugas_id
        WHERE 1=1
      `;
      
      let countQuery = `
        SELECT COUNT(*) as total
        FROM t_penilaian_header p
        WHERE 1=1
      `;
      
      const params = {};
      
      // Filters
      let whereClause = '';
      
      if (filters.layanan_id) {
        whereClause += ` AND p.layanan_id = @layanan_id`;
        params.layanan_id = filters.layanan_id;
      }
      
      if (filters.petugas_id) {
        whereClause += ` AND p.petugas_id = @petugas_id`;
        params.petugas_id = filters.petugas_id;
      }
      
      if (filters.status_penilaian) {
        whereClause += ` AND p.status_penilaian = @status_penilaian`;
        params.status_penilaian = filters.status_penilaian;
      }
      
      if (filters.tanggal_from) {
        whereClause += ` AND p.tanggal_penilaian >= @tanggal_from`;
        params.tanggal_from = filters.tanggal_from;
      }
      
      if (filters.tanggal_to) {
        whereClause += ` AND p.tanggal_penilaian <= @tanggal_to`;
        params.tanggal_to = filters.tanggal_to;
      }
      
      if (filters.no_mr) {
        whereClause += ` AND p.no_mr = @no_mr`;
        params.no_mr = filters.no_mr;
      }
      
      query += whereClause;
      countQuery += whereClause;
      
      query += `
        ORDER BY p.tanggal_penilaian DESC, p.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;
      
      params.offset = offset;
      params.limit = limit;
      
      // Execute queries
      const [dataResult, countResult] = await Promise.all([
        db.executeLocalQuery(query, params),
        db.executeLocalQuery(countQuery, params),
      ]);
      
      return {
        data: dataResult.recordset,
        pagination: {
          page,
          limit,
          total: countResult.recordset[0].total,
          totalPages: Math.ceil(countResult.recordset[0].total / limit),
        },
      };
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get penilaian list', error.message);
    }
  }
  
  /**
   * Delete Penilaian (only draft)
   * 
   * @param {number} id - Penilaian ID
   */
  async delete(id) {
    try {
      const penilaian = await this.getById(id, false);
      
      if (penilaian.status_penilaian !== 'draft') {
        throw new ApiError(400, 'Cannot delete submitted penilaian');
      }
      
      // Delete will cascade to details (ON DELETE CASCADE)
      await db.executeLocalQuery(`
        DELETE FROM t_penilaian_header
        WHERE penilaian_id = @id
      `, { id });
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete penilaian', error.message);
    }
  }
}

module.exports = new PenilaianService();