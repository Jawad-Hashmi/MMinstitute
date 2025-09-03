require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

const adminRoutes = require("./Routes/admin_route");
const userRoutes = require("./Routes/user_route");
const blogRoutes = require("./Routes/blog_route");

const app = express();

// ======================
// CORS SETUP - Allow all origins
// ======================
app.use(
  cors({
    origin: "*", // Allow every frontend origin
    credentials: true, // Keep this if you use cookies or JWT
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  })
);

// ======================
// STATIC FILES
// ======================
app.use("/uploads", express.static("uploads"));

// ======================
// BODY PARSERS
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// MULTER SETUP
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ======================
// ROUTES
// ======================

// Blog POST route with auth & file upload
app.post(
  "/api/admin/blogs",
  require("./Middleware/auth"), // Admin JWT auth
  upload.single("coverImage"), // Multer file upload
  require("./controller/blog_controller").postBlog
);

// Other blog routes (GET, PATCH, DELETE)
app.use("/api", blogRoutes);

// Admin routes (other than blog creation)
app.use("/api/admin", adminRoutes);

// User routes
app.use("/api/user", userRoutes);

// ======================
// DATABASE CONNECTION
// ======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
