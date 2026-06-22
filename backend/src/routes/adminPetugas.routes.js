const express = require("express");
const Joi = require("joi");
const { validate } = require("../middleware/validator");
const { authAdmin } = require("../middleware/adminAuth");
const adminPetugasController = require("../controllers/adminPetugas.controller");

const router = express.Router();
router.use(authAdmin);

router.get("/", adminPetugasController.list);
router.get(
  "/search",
  validate(
    Joi.object({
      q: Joi.string().min(2).max(100).required(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }),
    "query"
  ),
  adminPetugasController.search
);

router.patch(
  "/:id/toggle-duty",
  validate(
    Joi.object({
      status: Joi.boolean().required(),
    }),
    "body"
  ),
  adminPetugasController.toggleDuty
);

module.exports = router;