const Election = require("../models/election.js");

const createElection = async (req, res) => {
  try {
    const {
      electionId,
      title,
      description,
      startDate,
      endDate,
    } = req.body;

    // Check required fields
    if (
      !electionId ||
      !title ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Election ID, title, start date and end date are required",
      });
    }

    // Check if election ID already exists
    const existingElection = await Election.findOne({
      electionId,
    });

    if (existingElection) {
      return res.status(409).json({
        success: false,
        message: "Election ID already exists",
      });
    }

    // Check date validity
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const election = new Election({
      electionId,
      title,
      description,
      startDate,
      endDate,
      status: "upcoming",
    });

    await election.save();

    res.status(201).json({
      success: true,
      message: "Election created successfully",
      election,
    });
  } catch (error) {
    console.error("Create election error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating election",
    });
  }
};
const getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: elections.length,
      elections,
    });
  } catch (error) {
    console.error("Get elections error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching elections",
    });
  }
};
const deleteElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOneAndDelete({
      electionId,
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Election deleted successfully",
      election,
    });
  } catch (error) {
    console.error("Delete election error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting election",
    });
  }
};
const updateElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date and end date are required",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const election = await Election.findOneAndUpdate(
      { electionId },
      {
        title,
        description,
        startDate,
        endDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Election updated successfully",
      election,
    });
  } catch (error) {
    console.error("Update election error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating election",
    });
  }
};
const activateElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Election is already active",
      });
    }

    if (election.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed election cannot be activated",
      });
    }

    // Make sure only one election is active at a time
    await Election.updateMany(
      { status: "active" },
      { $set: { status: "completed" } }
    );

    election.status = "active";
    await election.save();

    res.status(200).json({
      success: true,
      message: "Election activated successfully",
      election,
    });

  } catch (error) {
    console.error("Activate election error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to activate election",
    });
  }
};
const completeElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only an active election can be completed",
      });
    }

    election.status = "completed";

    await election.save();

    res.status(200).json({
      success: true,
      message: "Election completed successfully",
      election,
    });

  } catch (error) {
    console.error("Complete election error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to complete election",
    });
  }
};
module.exports = {
  createElection,
  getElections,
  deleteElection,
  updateElection,
  completeElection,
  activateElection,
};  
