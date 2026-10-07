const crypto = require("crypto");

const Vote = require("../models/vote");
const VoterStatus = require("../models/voter-status");
const Election = require("../models/election");
const Candidate = require("../models/candidate");

const generateVoteHash = (electionId, candidateId, votedAt) => {
  const secret = process.env.VOTE_STATUS_SECRET;

  const payload = `${electionId}:${candidateId}:${votedAt}`;

  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
};


// Cast vote
const castVote = async (req, res) => {
  try {
    const { voterId, electionId, candidateId } = req.body;

    if (!voterId || !electionId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: "Voter ID, election ID and candidate ID are required",
      });
    }

    // Check election
    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    // Check candidate
    const candidate = await Candidate.findOne({
      candidateId,
      electionId,
      status: "active",
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found for this election",
      });
    }

    // Find voter status
    const voterStatus = await VoterStatus.findOne({
      voterId,
      electionId,
    });

    if (!voterStatus) {
      return res.status(404).json({
        success: false,
        message: "Voter status not found",
      });
    }

    // Check whether voter already voted
    if (voterStatus.hasVoted) {
      return res.status(403).json({
        success: false,
        message: "Voter has already cast their vote",
      });
    }

    // Create vote timestamp
    const votedAt = new Date();

    // Generate integrity hash
    const integrityHash = generateVoteHash(
      electionId,
      candidateId,
      votedAt.toISOString()
    );

    // IMPORTANT:
    // voterId is intentionally NOT stored in Vote
    const vote = await Vote.create({
      electionId,
      candidateId,
      votedAt,
      integrityHash,
    });

    // Mark voter as having voted
    voterStatus.hasVoted = true;

    const statusPayload =
      `${voterId}:${electionId}:${voterStatus.hasVoted}`;

    voterStatus.statusHash = crypto
      .createHmac("sha256", process.env.VOTE_STATUS_SECRET)
      .update(statusPayload)
      .digest("hex");

    await voterStatus.save();

    res.status(201).json({
      success: true,
      message: "Vote cast successfully",
      vote: {
        electionId: vote.electionId,
        candidateId: vote.candidateId,
        votedAt: vote.votedAt,
      },
    });

  } catch (error) {
    console.error("Cast vote error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while casting vote",
    });
  }
};


// Get votes for an election
const getVotesByElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const votes = await Vote.find({ electionId })
      .sort({ votedAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: votes.length,
      votes,
    });

  } catch (error) {
    console.error("Get votes error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching votes",
    });
  }
};


module.exports = {
  castVote,
  getVotesByElection,
};