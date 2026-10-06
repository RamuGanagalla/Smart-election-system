const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    rfidUid: {
      type: String,
      required: true,
      unique: true,
    },

    fingerprintTemplate: {
      type: String,
    },

    faceTemplate: {
      type: String,
    },

    hasVoted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Voter", voterSchema);