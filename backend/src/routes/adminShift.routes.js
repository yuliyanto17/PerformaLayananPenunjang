const express = require("express");
const Joi = require("joi");
const { validate } = require("../middleware/validator");
const { authAdmin } = require("../middleware/adminAuth");
const adminShiftController = require("../controllers/adminShift.controller");

const router = express.Router();
router.use(authAdmin);

router.post(
  "/apply",
  validate(
    Joi.object({
      shift_date: Joi.date().required(),
      shift_name: Joi.string().valid("PAGI", "SIANG", "MALAM").required(),
      petugas_ids: Joi.array().items(Joi.number().integer().positive()).required(),
    }),
    "body"
  ),
  adminShiftController.apply
);

router.get(
  "/status",
  validate(
    Joi.object({
      shift_date: Joi.date().required(),
      shift_name: Joi.string().valid("PAGI", "SIANG", "MALAM").required(),
    }),
    "query"
  ),
  adminShiftController.status
);

router.post("/end-all", adminShiftController.endAll);

module.exports = router;