const Admin = require("../models/admin_model");

const checkAdminExists = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    req.admin = admin; // Attach found admin to request
    next();
  } catch (err) {
    console.error("Admin lookup error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = checkAdminExists;
