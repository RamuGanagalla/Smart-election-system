const express = require("express");

const {
  addCandidate,
  getCandidates,
  getCandidatesByElection,
  getCandidate,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");

const router = express.Router();

// Add candidate
router.post("/", addCandidate);

// Get all candidates
router.get("/", getCandidates);

// Get candidates for a specific election
router.get("/election/:electionId", getCandidatesByElection);

// Get single candidate
router.get("/:candidateId", getCandidate);

// Update candidate
router.put("/:candidateId", updateCandidate);

// Delete candidate
router.delete("/:candidateId", deleteCandidate);

module.exports = router;