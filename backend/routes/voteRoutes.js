const express = require("express");

const {
  castVote,
  getVotesByElection,
} = require("../controllers/voteController");

const router = express.Router();

router.post("/", castVote);

router.get("/election/:electionId", getVotesByElection);

module.exports = router;