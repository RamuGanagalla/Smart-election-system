const crypto = require("crypto");

const VoterProfile = require("../models/voter-profile");
const VoterCredential = require("../models/voter-credentials");
const VoterStatus = require("../models/voter-status");

// Generate HMAC for voter status
const generateStatusHash = (voterId, electionId, hasVoted) => {
  const secret = process.env.VOTE_STATUS_SECRET;

  if (!secret) {
    throw new Error("VOTE_STATUS_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${voterId}:${electionId}:${hasVoted}`)
    .digest("hex");
};


// Register a new voter
const registerVoter = async (req, res) => {
  try {
    const {
      voterId,
      name,
      email,
      gender,
      age,
      rfidUid,
      fingerprintTemplate,
      faceTemplate,
      electionId,
    } = req.body;

    if (
      !voterId ||
      !name ||
      !email ||
      !gender ||
      !age ||
      !rfidUid ||
      !electionId
    ) {
      return res.status(400).json({
        success: false,
        message: "All required voter details must be provided",
      });
    }

    // Check duplicate voter ID
    const existingProfile = await VoterProfile.findOne({ voterId });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Voter ID already exists",
      });
    }

    // Check duplicate email
    const existingEmail = await VoterProfile.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check duplicate RFID
    const existingRFID = await VoterCredential.findOne({ rfidUid });

    if (existingRFID) {
      return res.status(409).json({
        success: false,
        message: "RFID UID already exists",
      });
    }

    // Create personal information
    const voterProfile = await VoterProfile.create({
      voterId,
      name,
      email,
      gender,
      age,
    });

    try {
      // Create sensitive credentials
      await VoterCredential.create({
        voterId,
        rfidUid,
        fingerprintTemplate: fingerprintTemplate || null,
        faceTemplate: faceTemplate || null,
      });

      // Initial voting status
      const hasVoted = false;

      const statusHash = generateStatusHash(
        voterId,
        electionId,
        hasVoted
      );

      await VoterStatus.create({
        voterId,
        electionId,
        hasVoted,
        statusHash,
      });

    } catch (error) {
      // Roll back profile if another collection fails
      await VoterProfile.deleteOne({ voterId });

      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Voter registered successfully",
      voter: {
        voterId,
        name,
        email,
        gender,
        age,
      },
    });

  } catch (error) {
    console.error("Register voter error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while registering voter",
    });
  }
};


// Get all voters
// Get all voters
const getVoters = async (req, res) => {
  try {
    const profiles = await VoterProfile.find()
      .sort({ createdAt: -1 })
      .lean();

    const voters = await Promise.all(
      profiles.map(async (profile) => {
        // Get credentials
        const credentials =
          await VoterCredential.findOne({
            voterId: profile.voterId,
          }).lean();

        // Get voting status for all elections
        const statuses =
          await VoterStatus.find({
            voterId: profile.voterId,
          })
            .select(
              "voterId electionId hasVoted statusHash createdAt updatedAt"
            )
            .lean();

        return {
          profile,
          credentials: credentials || null,
          statuses: statuses || [],
        };
      })
    );

    res.status(200).json({
      success: true,
      count: voters.length,
      voters,
    });
  } catch (error) {
    console.error(
      "Get voters error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching voters",
    });
  }
};

// Get a single voter
const getVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const profile = await VoterProfile.findOne({
      voterId,
    }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Voter not found",
      });
    }

    const credentials = await VoterCredential.findOne({
      voterId,
    }).lean();

    res.status(200).json({
      success: true,
      voter: {
        profile
      },
    });

  } catch (error) {
    console.error("Get voter error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching voter",
    });
  }
};


// Update voter
const updateVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const {
      name,
      email,
      gender,
      age,
      rfidUid,
      fingerprintTemplate,
      faceTemplate,
    } = req.body;

    if (!name || !email || !gender || !age || !rfidUid) {
      return res.status(400).json({
        success: false,
        message: "Name, email, gender, age and RFID UID are required",
      });
    }

    const voter = await VoterProfile.findOne({ voterId });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "Voter not found",
      });
    }

    // Check duplicate email
    const duplicateEmail = await VoterProfile.findOne({
      email,
      voterId: { $ne: voterId },
    });

    if (duplicateEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already assigned to another voter",
      });
    }

    // Check duplicate RFID
    const duplicateRFID = await VoterCredential.findOne({
      rfidUid,
      voterId: { $ne: voterId },
    });

    if (duplicateRFID) {
      return res.status(409).json({
        success: false,
        message: "RFID UID is already assigned to another voter",
      });
    }

    // Update profile
    voter.name = name;
    voter.email = email;
    voter.gender = gender;
    voter.age = age;

    await voter.save();

    // Update credentials
    await VoterCredential.findOneAndUpdate(
      { voterId },
      {
        rfidUid,
        fingerprintTemplate: fingerprintTemplate || null,
        faceTemplate: faceTemplate || null,
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Voter updated successfully",
      voter: {
        voterId,
        name,
        email,
        gender,
        age,
        rfidUid,
      },
    });

  } catch (error) {
    console.error("Update voter error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating voter",
    });
  }
};


// Delete voter
const deleteVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await VoterProfile.findOne({ voterId });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "Voter not found",
      });
    }

    // Delete personal information
    await VoterProfile.deleteOne({ voterId });

    // Delete credentials
    await VoterCredential.deleteOne({ voterId });

    // Delete voting status records
    await VoterStatus.deleteMany({ voterId });

    res.status(200).json({
      success: true,
      message: "Voter deleted successfully",
    });

  } catch (error) {
    console.error("Delete voter error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting voter",
    });
  }
};


// Verify RFID
const verifyRFID = async (req, res) => {
  try {
    const { rfidUid, electionId } = req.body;

    if (!rfidUid) {
      return res.status(400).json({
        success: false,
        message: "RFID UID is required",
      });
    }

    const credentials = await VoterCredential.findOne({
      rfidUid,
    });

    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: "RFID not registered",
      });
    }

    const profile = await VoterProfile.findOne({
      voterId: credentials.voterId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Voter profile not found",
      });
    }

    // Check voting status when election ID is supplied
    if (electionId) {
      const voterStatus = await VoterStatus.findOne({
        voterId: credentials.voterId,
        electionId,
      });

      if (voterStatus) {
        const expectedHash = generateStatusHash(
          credentials.voterId,
          electionId,
          voterStatus.hasVoted
        );

        if (expectedHash !== voterStatus.statusHash) {
          return res.status(403).json({
            success: false,
            message: "Voter status integrity verification failed",
          });
        }

        if (voterStatus.hasVoted) {
          return res.status(403).json({
            success: false,
            message: "This voter has already cast their vote",
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "RFID verified successfully",
      voter: {
        voterId: profile.voterId,
        name: profile.name,
      },
    });

  } catch (error) {
    console.error("RFID verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// Verify fingerprint
const verifyfingerprint = async (req, res) => {
  try {
    const {
      voterId,
      fingerprintTemplate,
    } = req.body;

    if (!voterId || !fingerprintTemplate) {
      return res.status(400).json({
        success: false,
        message: "Voter ID and fingerprint template are required",
      });
    }

    const credentials = await VoterCredential.findOne({
      voterId,
    });

    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: "Voter credentials not found",
      });
    }

    if (
      credentials.fingerprintTemplate !== fingerprintTemplate
    ) {
      return res.status(403).json({
        success: false,
        message: "Fingerprint does not match",
      });
    }

    const profile = await VoterProfile.findOne({
      voterId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Voter profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fingerprint verified successfully",
      voter: {
        voterId: profile.voterId,
        name: profile.name,
      },
    });

  } catch (error) {
    console.error("Fingerprint verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// Update vote status
const updateVoteStatus = async (req, res) => {
  try {
    const { voterId } = req.params;
    const { electionId } = req.body;

    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: "Election ID is required",
      });
    }

    const voter = await VoterProfile.findOne({
      voterId,
    });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "Voter not found",
      });
    }

    const voterStatus = await VoterStatus.findOne({
      voterId,
      electionId,
    });

    if (!voterStatus) {
      return res.status(404).json({
        success: false,
        message: "Voter status not found for this election",
      });
    }

    if (voterStatus.hasVoted) {
      return res.status(403).json({
        success: false,
        message: "Voter has already voted",
      });
    }

    // Change status
    voterStatus.hasVoted = true;

    // Generate new integrity hash
    voterStatus.statusHash = generateStatusHash(
      voterId,
      electionId,
      true
    );

    await voterStatus.save();

    res.status(200).json({
      success: true,
      message: "Vote status updated successfully",
    });

  } catch (error) {
    console.error("Update vote status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update vote status",
    });
  }
};


module.exports = {
  registerVoter,
  getVoters,
  getVoter,
  updateVoter,
  deleteVoter,
  verifyRFID,
  verifyfingerprint,
  updateVoteStatus,
};