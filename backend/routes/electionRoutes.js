const express = require("express");
const { createElection,getElections,deleteElection,updateElection ,activateElection,completeElection} = require("../controllers/electionController.js");

const router = express.Router();

router.post("/", createElection);
router.get("/", getElections);
router.put("/:electionId", updateElection);
router.delete("/:electionId", deleteElection);
router.put("/:electionId/activate", activateElection);
router.put("/:electionId/complete", completeElection);
module.exports = router;