const { body, validationResult } = require("express-validator");
exports.validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is Required"),
  body("email").isEmail().withMessage("Valid Email Adress is Required"),
  body("password")
    .isLength({ min: 10 })
    .withMessage("Password must be at least 10 charachters long"),
];

exports.validateLogin = [
  body("email").isEmail().withMessage("Valid Email Adress is Required"),
  body("password").notEmpty().withMessage("Password is Required"),
];

exports.validateForgotPassword = [
  body("email").isEmail().withMessage("Valid Email Adress is Required"),
];
exports.validateResetPassword = [
  body("token").notEmpty().withMessage("Reset Token is Required"),
  body("newPassword")
    .isLength({ min: 10 })
    .withMessage("New Password must be at least 10 characters long"),
];

exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
