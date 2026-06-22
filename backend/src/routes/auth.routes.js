const express = require("express");
const Joi = require("joi");
const { validate } = require("../middleware/validator");
const { strictLimiter } = require("../middleware/security");
const { authPetugas } = require("../middleware/auth");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/petugas/login",
  strictLimiter,
  validate(
    Joi.object({
      username: Joi.string().required().max(50),
    }),
    "body"
  ),
  authController.loginPetugas
);

router.get("/me", authPetugas, authController.me);

module.exports = router;