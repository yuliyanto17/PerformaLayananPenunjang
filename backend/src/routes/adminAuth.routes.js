const express = require("express");
const Joi = require("joi");
const { validate } = require("../middleware/validator");
const { strictLimiter } = require("../middleware/security");
const { authAdmin } = require("../middleware/adminAuth");
const adminAuthController = require("../controllers/adminAuth.controller");

const router = express.Router();

router.post(
  "/login",
  strictLimiter,
  validate(
    Joi.object({
      username: Joi.string().required().max(50),
      password: Joi.string().required().max(100),
    }),
    "body"
  ),
  adminAuthController.login
);

router.get("/me", authAdmin, adminAuthController.me);

module.exports = router;