const express = require("express");
const router = express.Router();

const {
  registerFace,
} = require("../controllers/faceController");

router.post("/register-face", registerFace);

module.exports = router;