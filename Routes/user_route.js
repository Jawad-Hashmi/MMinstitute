const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
} = require("../controller/user_controller");

const {
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  checkValidation,
  validateLogin,
} = require("../Middleware/user_middleware");
const verifyToken = require("../Middleware/auth_user");

router.post("/register", validateRegister, checkValidation, registerUser);
router.post("/login", validateLogin, checkValidation, loginUser);
router.post(
  "/forgot-Password",
  validateForgotPassword,
  checkValidation,
  forgotPassword
);
router.post(
  "/reset-Password",
  validateResetPassword,
  checkValidation,
  resetPassword
);
router.post("/logout", verifyToken, logoutUser);

module.exports = router;
