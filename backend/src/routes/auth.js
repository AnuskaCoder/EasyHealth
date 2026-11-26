const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { runValidation } = require("../middleware/validate");
const { register, login, getMe, logout, refreshToken } = require("../controllers/authController");

const router = express.Router();

const registerValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").notEmpty().withMessage("Name is required"),
  body("role").isIn(["patient", "doctor"]).withMessage("Role must be patient or doctor"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", runValidation(registerValidation), register);
router.post("/login", runValidation(loginValidation), login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
router.post("/refresh", authenticate, refreshToken);

module.exports = router;
