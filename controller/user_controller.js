const { validationResult } = require("express-validator");
const User = require("../models/user_module");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Registraion Controller
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email Already Exist" });

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: "user",
    });
    await newUser.save();

    return res.status(201).json({ message: "User Registered Succesfully" });
  } catch (err) {
    console.error("Register Error", err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// login
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  const { password } = req.body;
  const user = req.user;

  try {
    if (user.role !== "user") {
      return res.status(403).json({ message: "Acess denied not a user" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ token, message: "Login Succesfully" });
  } catch (err) {
    console.error("Login Error", err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3600000;
    await user.save();

    return res.status(200).json({ message: "Reset Token Generated" });
  } catch (err) {
    console.error("Forgot Password Error", err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Reset Passeord
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or Expired Token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    return res.status(200).json({ message: "Password Reset Succesfully" });
  } catch (err) {
    console.error("Reset Password Error", err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
