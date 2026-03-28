const express = require("express");
const { body } = require("express-validator");
const {
  createCase,
  getMyCases,
  getAllCases,
  updateCaseStatus,
  assignDoctorManually,
  getCaseReport,
} = require("../controllers/caseController");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  auth,
  allowRoles("farmer"),
  [
    body("animalId").notEmpty(),
    body("problemType").isIn(["normal", "emergency"]),
    body("description").notEmpty(),
  ],
  validate,
  createCase
);

router.get("/my", auth, allowRoles("farmer", "doctor"), getMyCases);
router.get("/", auth, allowRoles("admin"), getAllCases);
router.get("/:id/report", auth, allowRoles("farmer", "doctor", "admin"), getCaseReport);
router.patch(
  "/:id/status",
  auth,
  allowRoles("doctor", "admin"),
  [
    body("status").isIn([
      "Pending",
      "Assigned",
      "Doctor On The Way",
      "Treatment Completed",
    ]),
  ],
  validate,
  updateCaseStatus
);
router.patch("/:id/assign", auth, allowRoles("admin"), [body("doctorId").notEmpty()], validate, assignDoctorManually);

module.exports = router;
