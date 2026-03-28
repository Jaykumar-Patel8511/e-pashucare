const express = require("express");
const { body } = require("express-validator");
const { register, verifyOtp, login } = require("../controllers/authController");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["farmer", "doctor", "admin"]),
    body("mobile").notEmpty(),
    body("address").notEmpty(),
    body("location.lat").isNumeric(),
    body("location.long").isNumeric(),
  ],
  validate,
  register
);

router.post("/verify-otp", [body("email").isEmail(), body("otp").isLength({ min: 6, max: 6 })], validate, verifyOtp);
router.post("/login", [body("email").isEmail(), body("password").notEmpty()], validate, login);

module.exports = router;
