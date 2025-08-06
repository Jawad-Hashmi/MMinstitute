const express = require("express");
const router = express.Router();
const { postBlog, getBlogs } = require("../controller/blog_controller");

// Optional: import adminAuth if you want to restrict posting
// const adminAuth = require("../middleware/admin_auth");

// Admin: Post a blog
router.post("/admin/blogs", /* adminAuth, */ postBlog);

// User: Get all blogs
router.get("/user/blogs", getBlogs);

module.exports = router;
