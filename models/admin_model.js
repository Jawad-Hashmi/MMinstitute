const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password: String,
  role: {
    type: String,
    default: "Admin",
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpire: {
    type: Date,
  },
});
// Hash Password Before Saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bycrypt.hash(this.password, 10);
  next();
});
const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
