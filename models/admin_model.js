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
    enum: ["admin", "sub-admin"],
    default: "admin",
  },
  createdAt: {
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
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);

// ================================
// CREATE DEFAULT ADMIN IF NONE EXISTS
// ================================
async function createDefaultAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ role: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("msjah786", 10); // default password
      const admin = new Admin({
        name: "Jawad Mehmood",
        email: "jawadhashmi0102@gmail.com",
        password: hashedPassword,
        role: "admin",
      });
      await admin.save();
      console.log("✅ Default admin created: jawadhashmi154@gmail.com");
    } else {
      console.log("✅ Admin already exists, no default admin created");
    }
  } catch (err) {
    console.error("Error creating default admin:", err);
  }
}

// Run this after DB connection
mongoose.connection.once("open", () => {
  createDefaultAdmin();
});

module.exports = Admin;
