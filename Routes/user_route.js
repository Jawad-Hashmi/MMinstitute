const express = require("express");
const router = express.Router();
console.log("✅ User routes loaded");

const {
  sendOtp,
  verifyOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
} = require("../controller/user_controller");

const {
  validateForgotPassword,
  validateResetPassword,
  checkValidation,
  validateLogin,
} = require("../Middleware/user_middleware");
const verifyToken = require("../Middleware/auth_user");

// ✅ OTP-based Registration
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// ✅ Authentication
router.post("/login", validateLogin, checkValidation, loginUser);
router.post("/logout", verifyToken, logoutUser);

// ✅ Password reset
router.post("/forgot-password", validateForgotPassword, checkValidation, forgotPassword);
router.post("/reset-password", validateResetPassword, checkValidation, resetPassword);

module.exports = router;
