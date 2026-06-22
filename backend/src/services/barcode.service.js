// src/services/barcode.service.js

/**
 * ============================================
 * BARCODE SERVICE
 * ============================================
 * 
 * Service untuk handle barcode/QR code operations
 */

const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

class BarcodeService {
  
  /**
   * Validate Barcode Token
   * 
   * Validate dan get petugas by barcode token
   * Log scan attempt
   * 
   * @param {string} token - Barcode token
   * @param {Object} context - Additional context (layanan_id, session_id, device_info)
   * @returns {Promise<Object>}
   */
  async validate(token, context = {}) {
    try {
      // Get petugas by token
      const petugasResult = await db.executeLocalQuery(`
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
          p.is_on_duty,
          p.email,
          p.no_telp
        FROM m_petugas p
        INNER JOIN m_layanan_penunjang l ON p.layanan_id = l.layanan_id
        WHERE p.barcode_token = @token
      `, { token });
      
      const petugas = petugasResult.recordset[0];
      
      // Log scan attempt
      let scanResult = 'success';
      let errorMessage = null;
      
      if (!petugas) {
        scanResult = 'invalid';
        errorMessage = 'Barcode tidak valid';
      } else if (!petugas.is_active) {
        scanResult = 'inactive';
        errorMessage = 'Petugas tidak aktif';
      } else if (context.layanan_id && petugas.layanan_id !== context.layanan_id) {
        scanResult = 'mismatch';
        errorMessage = 'Petugas tidak sesuai dengan layanan yang dipilih';
      } else if (!petugas.is_on_duty) {
        scanResult = 'off_duty';
        errorMessage = 'Petugas sedang tidak bertugas';
      }
      
      // Insert scan log
      await db.executeLocalQuery(`
        INSERT INTO t_scan_log (
          barcode_token,
          petugas_id,
          layanan_id,
          scan_result,
          error_message,
          session_id,
          device_type,
          browser_info,
          ip_address,
          scan_timestamp
        ) VALUES (
          @token,
          @petugas_id,
          @layanan_id,
          @scan_result,
          @error_message,
          @session_id,
          @device_type,
          @browser_info,
          @ip_address,
          GETDATE()
        )
      `, {
        token,
        petugas_id: petugas?.petugas_id || null,
        layanan_id: context.layanan_id || null,
        scan_result: scanResult,
        error_message: errorMessage,
        session_id: context.session_id || null,
        device_type: context.device_type || null,
        browser_info: context.browser_info || null,
        ip_address: context.ip_address || null,
      });
      
      // Throw error jika tidak valid
      if (scanResult !== 'success') {
        throw new ApiError(400, errorMessage);
      }
      
      return petugas;
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to validate barcode', error.message);
    }
  }
  
  /**
   * Generate QR Code for Petugas
   * 
   * Generate QR code image dan save ke file
   * 
   * @param {number} petugasId - Petugas ID
   * @returns {Promise<Object>}
   */
  async generateQRCode(petugasId) {
    try {
      // Get petugas data
      const result = await db.executeLocalQuery(`
        SELECT 
          petugas_id,
          nip,
          nama_petugas,
          barcode_token,
          layanan_id
        FROM m_petugas
        WHERE petugas_id = @petugasId
      `, { petugasId });
      
      const petugas = result.recordset[0];
      
      if (!petugas) {
        throw new ApiError(404, 'Petugas not found');
      }
      
      // Prepare QR data (bisa JSON atau simple string)
      const qrData = {
        type: 'PETUGAS_BARCODE',
        token: petugas.barcode_token,
        petugas_id: petugas.petugas_id,
        nip: petugas.nip,
        nama: petugas.nama_petugas,
        generated_at: new Date().toISOString(),
      };
      
      // QR Code options
      const qrOptions = {
        errorCorrectionLevel: config.upload.qrCodeErrorCorrection,
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: config.upload.qrCodeSize,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      };
      
      // Generate filename
      const filename = `QR_${petugas.nip}_${Date.now()}.png`;
      const filepath = path.join(config.upload.qrCodePath, filename);
      
      // Ensure directory exists
      if (!fs.existsSync(config.upload.qrCodePath)) {
        fs.mkdirSync(config.upload.qrCodePath, { recursive: true });
      }
      
      // Generate QR code
      await QRCode.toFile(
        filepath,
        JSON.stringify(qrData),
        qrOptions
      );
      
      // Update petugas record
      await db.executeLocalQuery(`
        UPDATE m_petugas
        SET 
          qr_code_path = @qr_code_path,
          qr_last_generated = GETDATE(),
          updated_at = GETDATE()
        WHERE petugas_id = @petugasId
      `, {
        petugasId,
        qr_code_path: filepath,
      });
      
      return {
        petugas_id: petugas.petugas_id,
        nip: petugas.nip,
        nama_petugas: petugas.nama_petugas,
        qr_code_path: filepath,
        qr_code_url: `/uploads/qrcodes/${filename}`,
        generated_at: new Date(),
      };
      
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to generate QR code', error.message);
    }
  }
  
  /**
   * Get QR Code as Base64
   * 
   * Generate QR code as base64 string (untuk display langsung)
   * 
   * @param {string} token - Barcode token
   * @returns {Promise<string>} Base64 string
   */
  async getQRCodeBase64(token) {
    try {
      const qrData = {
        type: 'PETUGAS_BARCODE',
        token: token,
        timestamp: Date.now(),
      };
      
      const qrOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      };
      
      // Generate as base64
      const qrBase64 = await QRCode.toDataURL(
        JSON.stringify(qrData),
        qrOptions
      );
      
      return qrBase64;
      
    } catch (error) {
      throw new ApiError(500, 'Failed to generate QR code', error.message);
    }
  }
  
  /**
   * Get Scan Statistics
   * 
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  async getScanStats(filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_scans,
          SUM(CASE WHEN scan_result = 'success' THEN 1 ELSE 0 END) as successful_scans,
          SUM(CASE WHEN scan_result = 'invalid' THEN 1 ELSE 0 END) as invalid_scans,
          SUM(CASE WHEN scan_result = 'inactive' THEN 1 ELSE 0 END) as inactive_scans,
          SUM(CASE WHEN scan_result = 'mismatch' THEN 1 ELSE 0 END) as mismatch_scans
        FROM t_scan_log
        WHERE 1=1
      `;
      
      const params = {};
      
      if (filters.petugas_id) {
        query += ` AND petugas_id = @petugas_id`;
        params.petugas_id = filters.petugas_id;
      }
      
      if (filters.date_from) {
        query += ` AND CAST(scan_timestamp AS DATE) >= @date_from`;
        params.date_from = filters.date_from;
      }
      
      if (filters.date_to) {
        query += ` AND CAST(scan_timestamp AS DATE) <= @date_to`;
        params.date_to = filters.date_to;
      }
      
      const result = await db.executeLocalQuery(query, params);
      
      return result.recordset[0];
      
    } catch (error) {
      throw new ApiError(500, 'Failed to get scan statistics', error.message);
    }
  }
}

module.exports = new BarcodeService();