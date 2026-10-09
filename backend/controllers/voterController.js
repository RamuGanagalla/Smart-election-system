const crypto = require("crypto");

const VoterProfile = require("../models/voter-profile");
const VoterCredential = require("../models/voter-credentials");
const VoterStatus = require("../models/voter-status");
const Election = require("../models/election");

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
// Register a voter for an election
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

    // --------------------------------------------------
    // Check that the selected election exists
    // --------------------------------------------------
    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Selected election not found",
      });
    }

    // --------------------------------------------------
    // Check whether voter already exists
    // --------------------------------------------------
    const existingProfile = await VoterProfile.findOne({ voterId });

    // ==================================================
    // EXISTING VOTER
    // ==================================================
    if (existingProfile) {
      // Check whether this voter is already registered
      // for the selected election
      const existingStatus = await VoterStatus.findOne({
        voterId,
        electionId,
      });

      if (existingStatus) {
        return res.status(409).json({
          success: false,
          message: "Voter is already registered for this election",
        });
      }

      // Create a new election-specific status
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

      return res.status(201).json({
        success: true,
        message: `Voter registered successfully for ${election.title}`,
        voter: {
          voterId: existingProfile.voterId,
          name: existingProfile.name,
          email: existingProfile.email,
          gender: existingProfile.gender,
          age: existingProfile.age,
        },
        election: {
          electionId: election.electionId,
          title: election.title,
        },
      });
    }

    // ==================================================
    // NEW VOTER
    // ==================================================

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

    // --------------------------------------------------
    // Create voter profile
    // --------------------------------------------------
    await VoterProfile.create({
      voterId,
      name,
      email,
      gender,
      age,
    });

    try {
      // ------------------------------------------------
      // Create voter credentials
      // ------------------------------------------------
      let sanitizedFaceTemplate = [];
      if (Array.isArray(faceTemplate) && faceTemplate.length === 128) {
        sanitizedFaceTemplate = faceTemplate.map((n) => Number(n));
      }

      await VoterCredential.create({
        voterId,
        rfidUid,
        fingerprintTemplate: fingerprintTemplate || null,
        faceTemplate: sanitizedFaceTemplate,
      });

      // ------------------------------------------------
      // Create election-specific voting status
      // ------------------------------------------------
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
      // Roll back profile if credential/status creation fails
      await VoterProfile.deleteOne({ voterId });

      throw error;
    }

    // --------------------------------------------------
    // Success
    // --------------------------------------------------
    return res.status(201).json({
      success: true,
      message: `Voter registered successfully for ${election.title}`,
      voter: {
        voterId,
        name,
        email,
        gender,
        age,
      },
      election: {
        electionId: election.electionId,
        title: election.title,
      },
    });
  } catch (error) {
    console.error("Register voter error:", error);

    return res.status(500).json({
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
        // Get credentials (protect raw biometric vectors)
        const rawCredentials =
          await VoterCredential.findOne({
            voterId: profile.voterId,
          }).lean();

        let credentials = null;
        if (rawCredentials) {
          const hasFace =
            Array.isArray(rawCredentials.faceTemplate) &&
            rawCredentials.faceTemplate.length === 128;
          credentials = {
            ...rawCredentials,
            // Expose enrollment status flag, never the raw 128-float biometric vector
            faceTemplate: hasFace ? true : null,
          };
        }

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
    const credentialUpdate = {
      rfidUid,
    };
    if (fingerprintTemplate !== undefined) {
      credentialUpdate.fingerprintTemplate = fingerprintTemplate || null;
    }
    if (faceTemplate !== undefined && Array.isArray(faceTemplate) && faceTemplate.length === 128) {
      credentialUpdate.faceTemplate = faceTemplate.map((n) => Number(n));
    }

    await VoterCredential.findOneAndUpdate(
      { voterId },
      credentialUpdate,
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
// Verify RFID
const verifyRFID = async (req, res) => {
  try {
    const { rfidUid } = req.body;

    if (!rfidUid) {
      return res.status(400).json({
        success: false,
        message: "RFID UID is required",
      });
    }

    // Get the active election from MongoDB
    const activeElection = await Election.findOne({
      status: "active",
    }).sort({ startDate: -1 });

    if (!activeElection) {
      return res.status(404).json({
        success: false,
        message: "No active election is currently available",
      });
    }

    // Find voter credentials using RFID
    const credentials = await VoterCredential.findOne({
      rfidUid,
    });

    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: "RFID not registered",
      });
    }

    // Find voter profile
    const profile = await VoterProfile.findOne({
      voterId: credentials.voterId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Voter profile not found",
      });
    }

    // Find voter status for the active election
    const voterStatus = await VoterStatus.findOne({
      voterId: credentials.voterId,
      electionId: activeElection.electionId,
    });

    if (!voterStatus) {
      return res.status(403).json({
        success: false,
        message: "Voter is not registered for the active election",
      });
    }

    // Verify voter status integrity
    const expectedHash = generateStatusHash(
      credentials.voterId,
      activeElection.electionId,
      voterStatus.hasVoted
    );

    if (expectedHash !== voterStatus.statusHash) {
      return res.status(403).json({
        success: false,
        message: "Voter status integrity verification failed",
      });
    }

    // Prevent duplicate voting
    if (voterStatus.hasVoted) {
      return res.status(403).json({
        success: false,
        message: `This voter named ${profile.name} has already cast their vote`,
      });
    }

    res.status(200).json({
      success: true,
      message: "RFID verified successfully",

      voter: {
        voterId: profile.voterId,
        name: profile.name,
      },

      // Real election from MongoDB
      election: {
        electionId: activeElection.electionId,
        title: activeElection.title,
        startDate: activeElection.startDate,
        endDate: activeElection.endDate,
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