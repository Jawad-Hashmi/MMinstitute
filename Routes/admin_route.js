const express = require("express");
const { body } = require("express-validator");
const {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
  logoutAdmin,
} = require("../controller/admin_controller");

const checkAdminExists = require("../Middleware/AdminMiddleware");
const authMiddleware = require("../Middleware/auth");

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is Required"),
    body("email").isEmail().withMessage("Enter a Valid Email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password Must be at least 8 characters"),
  ],
  registerAdmin
);

// Login (uses middleware)
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid Email is Required"),
    body("password").notEmpty().withMessage("Password is Required"),
    checkAdminExists, // ✅ MIDDLEWARE HERE
  ],
  loginAdmin
);

// Forgot Password
router.post("/forgot-Password", forgotPassword);

// Reset Password
router.post("/ResetPassword", resetPassword);

// Dummy Protected Route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: `Welcome ${req.admin?.email || "Guest"}` });
});

router.post("/logout", authMiddleware, logoutAdmin);

module.exports = router;
