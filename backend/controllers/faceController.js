const VoterCredential = require("../models/voter-credentials");

const registerFace = async (req, res) => {
  try {
    const { voterId, faceTemplate } = req.body;

    if (!voterId || !Array.isArray(faceTemplate)) {
      return res.status(400).json({
        success: false,
        message: "Voter ID and face template are required",
      });
    }

    if (faceTemplate.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Invalid face template",
      });
    }

    const credential = await VoterCredential.findOne({ voterId });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Voter credentials not found",
      });
    }

    credential.faceTemplate = faceTemplate;

    await credential.save();

    res.status(200).json({
      success: true,
      message: "Face data enrolled successfully",
    });
  } catch (error) {
    console.error("Face enrollment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to enroll face data",
    });
  }
};

module.exports = {
  registerFace,
};