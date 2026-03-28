const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const validate = require("../middleware/validate");
const {
  updateMyLocation,
  updateMyAvailability,
  getMyDoctorStatus,
  getMyDoctorProfile,
  updateMyDoctorProfile,
} = require("../controllers/doctorController");

const router = express.Router();

router.use(auth, allowRoles("doctor"));

router.get("/me/status", getMyDoctorStatus);
router.get("/profile", getMyDoctorProfile);

router.put(
  "/update",
  [
    body("doctorName").trim().notEmpty().withMessage("Doctor Name is required"),
    body("email").isEmail().withMessage("Valid Email ID is required"),
    body("phone").matches(/^\d{10}$/).withMessage("Phone Number must be 10 digits"),
    body("specialization").trim().notEmpty().withMessage("Specialization is required"),
  ],
  validate,
  updateMyDoctorProfile
);

router.patch(
  "/location",
  [
    body("latitude").isFloat().withMessage("Latitude is required"),
    body("longitude").isFloat().withMessage("Longitude is required"),
    body("timestamp").optional().isISO8601().withMessage("Timestamp must be a valid ISO date"),
    body("availabilityStatus").optional().isIn(["Available", "On Case", "Offline"]),
  ],
  validate,
  updateMyLocation
);

router.patch(
  "/availability",
  [body("availabilityStatus").isIn(["Available", "On Case", "Offline"]).withMessage("Invalid availability status")],
  validate,
  updateMyAvailability
);

module.exports = router;
