const jwt = require("jsonwebtoken");
const Admin = require("../models/admin_model");

module.exports = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded); // Debugging

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) return res.status(401).json({ message: "Admin not found" });

    req.admin = admin; // Attach full admin object
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(400).json({ message: "Invalid token" });
  }
};
