const express = require("express");

const router = express.Router();

const { verifyRFID,verifyfingerprint ,updateVoteStatus } = require("../controllers/voterController");

router.post("/verify-rfid", verifyRFID);
router.post("/verify-fingerprint", verifyfingerprint);
router.put("/update-vote-status/:voterId", updateVoteStatus);
module.exports = router;