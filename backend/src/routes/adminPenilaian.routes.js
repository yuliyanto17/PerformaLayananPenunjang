const express = require("express");
const { authAdmin } = require("../middleware/adminAuth");
const adminPenilaianController = require("../controllers/adminPenilaian.controller");

const router = express.Router();
router.use(authAdmin);

// GET /api/v1/admin/penilaian
router.get("/", adminPenilaianController.getList);
router.get("/export", adminPenilaianController.exportExcel);
router.get("/:id", adminPenilaianController.getById);

module.exports = router;