const express = require("express");
const { authAdmin } = require("../middleware/adminAuth");
const adminDashboardController = require("../controllers/adminDashboard.controller");

const router = express.Router();
router.use(authAdmin);

router.get("/summary", adminDashboardController.summary);
router.get("/trend", adminDashboardController.trend);

module.exports = router;