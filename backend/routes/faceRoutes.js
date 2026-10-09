  const express = require("express");
  const router = express.Router();
  const {
    registerFace,
    verifyFace,
  } = require("../controllers/faceController");
  router.post("/register-face", registerFace);
  router.post("/verify-face", verifyFace);
  module.exports = router;