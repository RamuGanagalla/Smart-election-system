const Voter = require("../models/voter");

const verifyRFID = async (req, res) => {
  try {
    const { rfidUid } = req.body;

    if (!rfidUid) {
      return res.status(400).json({
        success: false,
        message: "RFID UID is required",
      });
    }

    const voter = await Voter.findOne({ rfidUid });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "RFID not registered",
      });
    }

    if (voter.hasVoted) {
      return res.status(403).json({
        success: false,
        message: "This voter has already casteed their vote",
      });
    }

    res.status(200).json({
      success: true,
      message: "RFID verified successfully",
      voter: {
        voterId: voter.voterId,
        name: voter.name,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const verifyfingerprint = async (req, res) => {
  try {
    const { voterId, fingerprintTemplate } = req.body;
    const voter=await Voter.findOne({ voterId});
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "Voter not found",
      });
    }
if (voter.fingerprintTemplate !== fingerprintTemplate) {
      return res.status(403).json({
        success: false,
        message: "Fingerprint does not match",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fingerprint verified successfully",
      voter: {
        voterId: voter.voterId,
        name: voter.name,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const updateVoteStatus = async (req, res) => {
  try {
    const { voterId } = req.params;
    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }
    voter.hasVoted = true;
    await voter.save();
    res.json({ success: true, message: "Vote status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to connect to the server" });
  }
};


module.exports = {
  verifyRFID,
  verifyfingerprint,
  updateVoteStatus
};  
