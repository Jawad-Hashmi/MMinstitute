const { validationResult } = require("express-validator");
const Admin = require("../models/admin_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Register Admin
exports.registerAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role } = req.body;
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({ message: "Email Already Exist" });
    }

    const newadmin = new Admin({ name, email, password, role });
    await newadmin.save();

    res.status(201).json({ message: "Admin Registered Succesfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Login Admin (uses middleware to find admin)
exports.loginAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;
  const admin = req.admin; // set by middleware

  try {
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res
      .status(200)
      .json({ token, role: admin.role, message: "Login Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    admin.resetToken = token;
    admin.resetTokenExpire = Date.now() + 3600000;
    await admin.save();

    res.status(200).json({ message: "Reset Token Generated", token });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  console.log("🚀 ~ newPassword:", newPassword);

  try {
    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    admin.password = newPassword;
    console.log("Before Save", admin.password);
    admin.resetToken = undefined;
    admin.resetTokenExpire = undefined;
    await admin.save();
    console.log("After Save", admin.password);

    res.status(200).json({ message: "Password reset Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.logoutAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(400).json({ message: "Admin not Found" });
    }

    admin.resetToken = undefined;
    admin.resetTokenExpire = undefined;
    await admin.save();

    return res.status(200).json({ message: "Logout Successfully" });
  } catch (err) {
    console.error("Logout Error", err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
