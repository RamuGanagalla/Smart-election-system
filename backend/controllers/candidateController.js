const Candidate = require("../models/candidate");
const Election = require("../models/election");

// Add candidate
const addCandidate = async (req, res) => {
  try {
    const {
      candidateId,
      electionId,
      name,
      email,
      symbol,
      manifesto,
    } = req.body;

    if (!candidateId || !electionId || !name) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID, election ID and name are required",
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

    // Check duplicate candidate ID
    const existingCandidate = await Candidate.findOne({
      candidateId,
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: "Candidate ID already exists",
      });
    }

    const candidate = await Candidate.create({
      candidateId,
      electionId,
      name,
      email: email || null,
      symbol: symbol || null,
      manifesto: manifesto || null,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Candidate added successfully",
      candidate,
    });
  } catch (error) {
    console.error("Add candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding candidate",
    });
  }
};


// Get all candidates
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Get candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching candidates",
    });
  }
};


// Get candidates for a particular election
const getCandidatesByElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const candidates = await Candidate.find({
      electionId,
      status: "active",
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Get election candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching election candidates",
    });
  }
};


// Get single candidate
const getCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findOne({
      candidateId,
    }).lean();

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      candidate,
    });
  } catch (error) {
    console.error("Get candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching candidate",
    });
  }
};


// Update candidate
const updateCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const {
      name,
      email,
      symbol,
      manifesto,
      status,
    } = req.body;

    const candidate = await Candidate.findOne({
      candidateId,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (name !== undefined) {
      candidate.name = name;
    }

    if (email !== undefined) {
      candidate.email = email;
    }

    if (symbol !== undefined) {
      candidate.symbol = symbol;
    }

    if (manifesto !== undefined) {
      candidate.manifesto = manifesto;
    }

    if (status !== undefined) {
      candidate.status = status;
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("Update candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating candidate",
    });
  }
};


// Delete candidate
const deleteCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findOneAndDelete({
      candidateId,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
      candidate,
    });
  } catch (error) {
    console.error("Delete candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting candidate",
    });
  }
};


module.exports = {
  addCandidate,
  getCandidates,
  getCandidatesByElection,
  getCandidate,
  updateCandidate,
  deleteCandidate,
};