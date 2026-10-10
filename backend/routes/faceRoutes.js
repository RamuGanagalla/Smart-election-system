  const express = require("express");
  const router = express.Router();
  const {
    verifyFace
  } = require("../controllers/faceController");
  router.post("/verify-face", verifyFace);
  module.exports = router;