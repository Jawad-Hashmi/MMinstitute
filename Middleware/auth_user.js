const User = require("../models/user_module");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No Token Provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User Not Found" });
    }
    req.user = user;
    req.token = token;

    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid Token" });
  }
};
