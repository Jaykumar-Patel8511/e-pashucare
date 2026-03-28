const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const validate = require("../middleware/validate");
const { getFarmerProfile, updateFarmerProfile } = require("../controllers/farmerController");

const router = express.Router();

router.use(auth, allowRoles("farmer"));

router.get("/profile", getFarmerProfile);

router.put(
  "/update",
  [
    body("name").trim().notEmpty().withMessage("Farmer Name is required"),
    body("mobile").matches(/^\d{10}$/).withMessage("Mobile Number must be 10 digits"),
    body("email").isEmail().withMessage("Valid Email ID is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("village").trim().notEmpty().withMessage("Village is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("district").trim().notEmpty().withMessage("District is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("pincode").matches(/^\d{6}$/).withMessage("Pincode must be 6 digits"),
    body("latitude").isFloat().withMessage("Latitude must be valid"),
    body("longitude").isFloat().withMessage("Longitude must be valid"),
  ],
  validate,
  updateFarmerProfile
);

module.exports = router;
