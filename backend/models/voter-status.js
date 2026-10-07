const mongoose = require("mongoose");

const voterStatusSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      ref: "VoterProfile",
    },

    electionId: {
      type: String,
      required: true,
      ref: "Election",
    },

    hasVoted: {
      type: Boolean,
      default: false,
    },

    statusHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "voter_status",
  }
);

voterStatusSchema.index(
  { voterId: 1, electionId: 1 },
  { unique: true }
);

module.exports = mongoose.model("VoterStatus", voterStatusSchema);