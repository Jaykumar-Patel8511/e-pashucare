const express = require("express");
const { body } = require("express-validator");
const { register } = require("../controllers/registrationController");
const validate = require("../middleware/validate");

const router = express.Router();

function isTruthyBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .if((_, { req }) => req.body.role !== "doctor")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("password")
      .if((_, { req }) => req.body.role === "doctor")
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage("Doctor password must be at least 8 chars with 1 uppercase, 1 number, and 1 special character"),
    body("role").isIn(["farmer", "doctor"]).withMessage("Role is invalid"),
    body("phone").matches(/^\d{10}$/).withMessage("Phone number must be 10 digits"),
    body("pincode")
      .if((_, { req }) => req.body.role !== "doctor")
      .matches(/^\d{6}$/)
      .withMessage("Pincode must be 6 digits"),
    body("address")
      .if((_, { req }) => req.body.role !== "doctor")
      .trim()
      .notEmpty()
      .withMessage("Address is required"),
    body("latitude")
      .if((_, { req }) => req.body.role !== "doctor")
      .isFloat()
      .withMessage("Latitude is required"),
    body("longitude")
      .if((_, { req }) => req.body.role !== "doctor")
      .isFloat()
      .withMessage("Longitude is required"),
    body("doctorCategory")
      .optional()
      .isIn(["General", "Surgery", "Reproduction", "Emergency Care", "Veterinary Specialist", "Artificial Insemination"]),
    body("sabhasadId")
      .if((_, { req }) => req.body.role === "farmer" && isTruthyBoolean(req.body.sabhasadMember ?? req.body.isSabhasadMember))
      .trim()
      .notEmpty()
      .withMessage("Sabhasad ID is required for Sabhasad farmer"),
    body("dairyId")
      .if((_, { req }) => req.body.role === "farmer" && isTruthyBoolean(req.body.sabhasadMember ?? req.body.isSabhasadMember))
      .trim()
      .notEmpty()
      .withMessage("Dairy ID is required for Sabhasad farmer"),
    body("doctorId")
      .if(body("role").equals("doctor"))
      .trim()
      .notEmpty()
      .withMessage("Doctor ID is required for doctor"),
    body("doctorCategory")
      .if(body("role").equals("doctor"))
      .trim()
      .notEmpty()
      .withMessage("Specialization is required for doctor"),
  ],
  validate,
  register
);

module.exports = router;
