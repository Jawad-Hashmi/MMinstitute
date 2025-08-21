const express = require("express");
const router = express.Router();
const {
  postBlog,
  getBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
  featureBlog,
  likeBlog,
  commentOnBlog,
  getFeaturedBlogs,
} = require("../controller/blog_controller");

const adminAuth = require("../Middleware/auth");
const userAuth = require("../Middleware/auth_user");
const upload = require("../Middleware/upload");

// Test route for file upload (no auth) - Keep for development/testing
// router.post("/test-upload", upload.single("coverImage"), (req, res) => {
//   console.log("BODY:", req.body);
//   console.log("FILE:", req.file);
//   res.json({ body: req.body, file: req.file });
// });

// ======================
// Admin Routes
// ======================

// Create blog (with file upload)
router.post(
  "/admin/blogs",
  adminAuth,
  upload.single("coverImage"), // Middleware for file upload
  postBlog
);

// Update blog
router.patch(
  "/admin/blogs/:id",
  adminAuth,
  upload.single("coverImage"), // Include upload for updates too
  updateBlog
);

// Delete blog
router.delete("/admin/blogs/:id", adminAuth, deleteBlog);

// Feature/unfeature blog
router.patch("/admin/blogs/:id/feature", adminAuth, featureBlog);
router.post("/admin/blogs/:id/like", adminAuth, likeBlog);
router.post("/admin/blogs/:id/comment", adminAuth, commentOnBlog);
router.post("/admin/blogs/:blogId/comment/:commentId/reply", adminAuth, commentOnBlog);

// ======================
// User Routes
// ======================
//get single blog
router.get("/blogs/id/:id", getSingleBlog);

// Get all blogs (public)
router.get("/blogs", getBlogs);

// Get featured blogs
router.get("/blogs/featured", getFeaturedBlogs);

// Get single blog by slug
router.get("/blogs/:slug", getSingleBlog);

// Like a blog
router.post("/blogs/:id/like", userAuth, likeBlog);

// Comment on a blog
router.post("/blogs/:id/comment", userAuth, commentOnBlog);
router.post("/blogs/:blogId/comment/:commentId/reply", userAuth, commentOnBlog);


module.exports = router;