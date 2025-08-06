require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./Routes/admin_route");
const userRoutes = require("./Routes/user_route");
const blogRoutes = require("./Routes/blog_route");
const cors = require("cors");

const app = express();

// ✅ Enable CORS for all routes
app.use(cors());

// ✅ Parse incoming JSON requests
app.use(express.json());

// ✅ Route handling
app.use("/api", blogRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Connection Error", err));

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
