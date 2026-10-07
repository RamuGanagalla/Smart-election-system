const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    electionId: {
      type: String,
      required: true,
      ref: "Election",
    },

    candidateId: {
      type: String,
      required: true,
      ref: "Candidate",
    },

    votedAt: {
      type: Date,
      default: Date.now,
    },

    integrityHash: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "votes",
  }
);

module.exports = mongoose.model("Vote", voteSchema);