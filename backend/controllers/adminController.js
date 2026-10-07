const bcrypt = require("bcrypt");
const Admin = require("../models/admin.js");
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =========================
// GET ADMIN PROFILE
// =========================
const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId).select(
      "-password"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =========================
// UPDATE ADMIN PROFILE
// =========================
const updateAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase(),
      _id: { $ne: adminId },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Email is already used by another admin",
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin,
    });
  } catch (error) {
    console.error("Update admin profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =========================
// CHANGE ADMIN PASSWORD
// =========================
const changeAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    admin.password = hashedPassword;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change admin password error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
};