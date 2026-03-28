const express = require("express");
const { getUsersByRole, updateUser, deleteUser, getAnalytics } = require("../controllers/adminController");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");

const router = express.Router();

router.use(auth, allowRoles("admin"));
router.get("/users/:role", getUsersByRole);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/analytics", getAnalytics);

module.exports = router;
