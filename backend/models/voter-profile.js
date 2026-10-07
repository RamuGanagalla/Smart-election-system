const mongoose = require("mongoose");

const voterProfileSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: 18,
    },
  },
  {
    timestamps: true,
    collection: "voter_profiles",
  }
);

module.exports = mongoose.model("VoterProfile", voterProfileSchema);