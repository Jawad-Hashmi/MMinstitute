const Blog = require("../models/blog_model");

// Admin: Post a blog
exports.postBlog = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Blog content is required" });
    }

    const blog = new Blog({
      content,
      createdBy: req.admin ? req.admin._id : undefined, // optional
    });

    await blog.save();
    res.status(201).json({ message: "Blog posted successfully", blog });
  } catch (err) {
    console.error("Post blog error:", err);
    res.status(500).json({ message: "Server error while posting blog" });
  }
};

// User: Get all blogs
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    console.error("Get blogs error:", err);
    res.status(500).json({ message: "Server error while fetching blogs" });
  }
};
