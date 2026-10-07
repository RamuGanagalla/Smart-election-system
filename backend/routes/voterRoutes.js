const express = require("express");

const {
  registerVoter,
  getVoters,
  getVoter,
  updateVoter,
  deleteVoter,
  verifyRFID,
  verifyfingerprint,
  updateVoteStatus,
} = require("../controllers/voterController");

const router = express.Router();

// Register voter
router.post("/register", registerVoter);

// Get all voters
router.get("/", getVoters);

// Get single voter
router.get("/:voterId", getVoter);

// Update voter
router.put("/:voterId", updateVoter);

// Delete voter
router.delete("/:voterId", deleteVoter);

// Verify RFID
router.post("/verify-rfid", verifyRFID);

// Verify fingerprint
router.post("/verify-fingerprint", verifyfingerprint);

// Update voting status
router.put("/update-vote-status/:voterId", updateVoteStatus);

module.exports = router;