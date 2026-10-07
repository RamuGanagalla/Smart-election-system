const express = require("express");
const {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require("../controllers/adminController");

const router = express.Router();

// Admin login
router.post("/login", loginAdmin);

// Admin profile
router.get("/profile/:adminId", getAdminProfile);
router.put("/profile/:adminId", updateAdminProfile);

// Change password
router.put("/password/:adminId", changeAdminPassword);

module.exports = router;