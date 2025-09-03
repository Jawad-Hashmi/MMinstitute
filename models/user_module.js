const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "Email is required"],
  },
  password: {
    type: String,
    minlength: [8, "Password must be at least 8 characters"],
    required:[true,"Password Is Required"]
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // 🔹 Password reset fields
  resetToken: String,
  resetTokenExpire: Date,

  // 🔹 OTP fields for new registration
  otp: String, // store hashed OTP
  otpExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
});

// 🔹 Hash password only if it's modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
