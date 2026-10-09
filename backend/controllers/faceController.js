const VoterCredential = require("../models/voter-credentials");

// Standard Euclidean distance threshold for 128-d face descriptors
const FACE_MATCH_THRESHOLD = 0.55;

/**
 * Enroll or update 128-d face descriptor for a voter
 * POST /api/voters/register-face
 */
const registerFace = async (req, res) => {
  try {
    const { voterId, faceTemplate } = req.body;
    const template = faceTemplate ;

    if (!voterId || typeof voterId !== "string" || !voterId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid Voter ID is required",
      });
    }

    if (!Array.isArray(template) || template.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "A valid 128-dimensional face descriptor array is required",
      });
    }

    const isValidNumbers = template.every(
      (val) => typeof val === "number" && !isNaN(val) && isFinite(val)
    );

    if (!isValidNumbers) {
      return res.status(400).json({
        success: false,
        message: "Face template values must be valid numbers",
      });
    }

    const credential = await VoterCredential.findOne({ voterId: voterId.trim() });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Voter credentials not found",
      });
    }

    credential.faceTemplate = template.map(Number);
    await credential.save();

    return res.status(200).json({
      success: true,
      message: "Face data enrolled successfully",
    });
  } catch (error) {
    console.error("Face enrollment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to enroll face data",
    });
  }
};

/**
 * Verify live face descriptor against stored template
 * POST /api/voters/verify-face
 */
const verifyFace = async (req, res) => {
  try {
    const { voterId, faceTemplate } = req.body;
    const template =faceTemplate;

    if (!voterId || typeof voterId !== "string" || !voterId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid Voter ID is required",
      });
    }

    if (!Array.isArray(template) || template.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Valid 128-dimensional live face descriptor array is required",
      });
    }

    const credential = await VoterCredential.findOne({ voterId: voterId.trim() });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Voter credentials not found",
      });
    }

    if (!credential.faceTemplate || credential.faceTemplate.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Face biometric not enrolled for this voter",
      });
    }

    let sum = 0;
    for (let i = 0; i < 128; i++) {
      const diff = Number(template[i]) - Number(credential.faceTemplate[i]);
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    if (distance <= FACE_MATCH_THRESHOLD) {
      return res.status(200).json({
        success: true,
        match: true,
        distance,
        message: "Face verified successfully",
      });
    } else {
      return res.status(200).json({
        success: false,
        match: false,
        distance,
        message: "Face does not match registered template",
      });
    }
  } catch (error) {
    console.error("Face verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during face verification",
    });
  }
};

module.exports = {
  registerFace,
  verifyFace,
};