const express = require("express");
const { authAdmin } = require("../middleware/adminAuth");
const adminKioskController = require("../controllers/adminKiosk.controller");

const router = express.Router();
router.use(authAdmin);

router.get("/on-duty", adminKioskController.onDutyList);

module.exports = router;