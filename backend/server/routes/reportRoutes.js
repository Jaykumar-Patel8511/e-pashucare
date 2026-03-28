const express = require("express");
const { body } = require("express-validator");
const { addReport } = require("../controllers/reportController");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  auth,
  allowRoles("doctor"),
  [body("caseId").notEmpty(), body("diagnosis").notEmpty(), body("prescription").notEmpty()],
  validate,
  addReport
);

module.exports = router;
