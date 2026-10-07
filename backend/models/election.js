const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    electionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Election", electionSchema);