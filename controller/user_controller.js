const { validationResult } = require("express-validator");
const User = require("../models/user_module");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/emailService"); // ✅ Import SendGrid helper

// =========================
// Login User
// =========================
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.role !== "user")
      return res.status(403).json({ message: "Access denied" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      role: user.role,
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// Forgot Password
// =========================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3600000; // 1 hr
    await user.save();

    // ✅ Send token via email
    await sendEmail({
      to: email,
      subject: "Password Reset Token",
      text: `Use this token to reset your password: ${token}. It expires in 1 hour.`,
    });

    return res.status(200).json({
      token,
      message: "Reset token generated and sent via email",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// Reset Password
// =========================
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = newPassword; // pre-save hook will hash
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// Logout User
// =========================
exports.logoutUser = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc)
      return res.status(400).json({ message: "User not found" });

    userDoc.resetToken = undefined;
    userDoc.resetTokenExpire = undefined;
    await userDoc.save();

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout Error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper: Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// =========================
// Send OTP for new registration
// =========================
exports.sendOtp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already registered" });
    }

    let user;
    if (!existingUser) {
      user = new User({
        name,
        email: email.toLowerCase(),
        password,
        role: role || "user",
      });
    } else {
      user = existingUser;
      user.name = name;
      user.password = password;
      user.role = role || "user";
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // ✅ Send OTP via email
    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Hello ${name}, your OTP is: ${otp}. It expires in 5 minutes.`,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};

// =========================
// Resend OTP
// =========================
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // ✅ Send new OTP via email
    await sendEmail({
      to: email,
      subject: "Your New OTP Code",
      text: `Your new OTP is: ${otp}. It expires in 5 minutes.`,
    });

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error resending OTP", error: error.message });
  }
};

// =========================
// Verify OTP
// =========================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not generated" });
    }

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({ message: "OTP verified successfully. Registration complete." });
  } catch (error) {
    return res.status(500).json({ message: "Error verifying OTP", error: error.message });
  }
};
