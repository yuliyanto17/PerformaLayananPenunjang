// src/routes/index.js

/**
 * ============================================
 * MAIN ROUTER
 * ============================================
 * 
 * Aggregate semua routes
 * Base URL: /api/v1
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const layananRoutes = require('./layanan.routes');
const petugasRoutes = require('./petugas.routes');
const pasienRoutes = require('./pasien.routes');
const pertanyaanRoutes = require('./pertanyaan.routes');
const penilaianRoutes = require('./penilaian.routes');
const barcodeRoutes = require('./barcode.routes');
const authRoutes = require("./auth.routes");
const adminAuthRoutes = require("./adminAuth.routes");
const adminPetugasRoutes = require("./adminPetugas.routes");
const adminShiftRoutes = require("./adminShift.routes");
const adminKioskRoutes = require("./adminKiosk.routes");
const adminDashboardRoutes = require("./adminDashboard.routes");
const adminPenilaianRoutes = require("./adminPenilaian.routes");

/**
 * API Info Endpoint
 * GET /api/v1
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Performa Layanan Penunjang API',
    version: '1.0.0',
    endpoints: {
      layanan: '/api/v1/layanan',
      petugas: '/api/v1/petugas',
      pasien: '/api/v1/pasien',
      pertanyaan: '/api/v1/pertanyaan',
      penilaian: '/api/v1/penilaian',
      barcode: '/api/v1/barcode',
    },
    documentation: '/api/v1/docs', // Nanti bisa tambah Swagger docs
  });
});

/**
 * Mount Routes
 */
router.use('/layanan', layananRoutes);
router.use('/petugas', petugasRoutes);
router.use('/pasien', pasienRoutes);
router.use('/pertanyaan', pertanyaanRoutes);
router.use('/penilaian', penilaianRoutes);
router.use('/barcode', barcodeRoutes);
router.use("/auth", authRoutes);
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin/petugas", adminPetugasRoutes);
router.use("/admin/shift", adminShiftRoutes);
router.use("/admin/kiosk", adminKioskRoutes);
router.use("/admin/dashboard", adminDashboardRoutes);
router.use("/admin/penilaian", adminPenilaianRoutes);

module.exports = router;