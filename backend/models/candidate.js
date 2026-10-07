const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    electionId: {
      type: String,
      required: true,
      ref: "Election",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    symbol: {
      type: String,
      trim: true,
    },

    manifesto: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "withdrawn", "disqualified"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "candidates",
  }
);

module.exports = mongoose.model("Candidate", candidateSchema);