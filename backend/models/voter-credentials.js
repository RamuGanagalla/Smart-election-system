const mongoose = require("mongoose");

const voterCredentialSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
      ref: "VoterProfile",
    },

    rfidUid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fingerprintTemplate: {
      type: String,
      default: null,
    },

    faceTemplate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "voter_credentials",
  }
);

module.exports = mongoose.model(
  "VoterCredential",
  voterCredentialSchema
);