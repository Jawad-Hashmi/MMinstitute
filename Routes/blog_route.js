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

// Admin routes
router.post("/admin/blogs", adminAuth, postBlog);
router.patch("/admin/blogs/:id", adminAuth, updateBlog);
router.delete("/admin/blogs/:id", adminAuth, deleteBlog);
router.patch("/admin/blogs/:id/feature", adminAuth, featureBlog);

// User routes
router.get("/blogs", getBlogs);
router.get("/blogs/featured", getFeaturedBlogs);
router.get("/blogs/:slug", getSingleBlog);
router.post("/blogs/:id/like", userAuth, likeBlog);
router.post("/blogs/:id/comment", userAuth, commentOnBlog);

module.exports = router;
