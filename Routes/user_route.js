const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controller/user_controller");

const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  checkValidation,
  validateRegister,
  validateLogin,
} = require("../Middleware/user_middleware");
const verifyToken = require("../Middleware/auth_user");

router.post("/register", validateRegister, checkValidation, registerUser);
router.post("/login", validateLogin, checkValidation, verifyToken, loginUser);
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

module.exports = router;
