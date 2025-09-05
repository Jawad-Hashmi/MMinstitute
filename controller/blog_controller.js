const Blog = require("../models/blog_model");
const slugify = require("slugify");
const Admin = require("../models/admin_model");

// ---------------- Utility ----------------
const getReadingStats = (content) => {
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);
  return { words, readingTime };
};

// ---------------- Create Blog (Admin) ----------------
exports.postBlog = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    const { title, content, tags: rawTags, author_name, author_email, author_avatar } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content are required" });
    if (!author_name || !author_email) return res.status(400).json({ message: "Author name and email are required" });

    const tags = rawTags
      ? Array.isArray(rawTags)
        ? rawTags
        : rawTags.split(",").map(tag => tag.trim())
      : [];

    const { words, readingTime } = getReadingStats(content);

    const blog = new Blog({
      title,
      slug: slugify(title, { lower: true, strict: true }),
      content,
      excerpt: req.body.excerpt || `${content.substring(0, 100)}...`,
      metaTitle: req.body.metaTitle || "",
      metaDescription: req.body.metaDescription || "",
      metaKeywords: req.body.metaKeywords || "",
      tags,
      coverImage: req.file ? req.file.path : null, // <-- Cloudinary URL
      readingTime,
      wordCount: words,
      author: { name: author_name, email: author_email, avatar: author_avatar || null },
      privacy: req.body.privacy || "public",
      status: req.body.status || "draft",
      isFeatured: req.body.isFeatured === "true",
      createdBy: admin._id
    });

    await blog.save();
    res.status(201).json({ message: "Blog created successfully", blog: blog.toObject() });
  } catch (error) {
    console.error("Blog creation error:", error);
    res.status(500).json({
      message: "Error creating blog",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};


// ---------------- Get All Blogs ----------------
exports.getBlogs = async (req, res) => {
  try {
    const { author, tag, featured } = req.query;
    const filter = { privacy: "public", status: "published" };

    if (author) filter["author.name"] = new RegExp(author, "i");
    if (tag) filter.tags = tag;
    if (featured === "true") filter.isFeatured = true;

    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).select("-content -comments");
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching blogs" });
  }
};

// ---------------- Get Featured Blogs ----------------
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isFeatured: true, privacy: "public", status: "published" })
      .sort({ createdAt: -1 })
      .select("-comments");
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching featured blogs" });
  }
};

// ---------------- Get Single Blog ----------------
exports.getSingleBlog = async (req, res) => {
  try {
    const { id, slug } = req.params;
    let blog;

    if (id) {
      blog = await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate("comments.user.id", "name avatar");
    } else if (slug) {
      blog = await Blog.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true }).populate("comments.user.id", "name avatar");
    }

    if (!blog) return res.status(404).json({ message: "Blog not found" });
    if (blog.privacy === "private" && !req.admin?.id) return res.status(403).json({ message: "Access denied to private blog" });

    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching blog" });
  }
};

// ---------------- Update Blog (Admin) ----------------
exports.updateBlog = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    let blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const tags = req.body.tags
      ? Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(",").map(tag => tag.trim())
      : blog.tags;

    const author = {
      name: req.body.author_name || blog.author.name,
      email: req.body.author_email || blog.author.email,
      avatar: req.body.author_avatar || blog.author.avatar
    };

    let readingTime = blog.readingTime;
    let wordCount = blog.wordCount;
    if (req.body.content) {
      const stats = getReadingStats(req.body.content);
      readingTime = stats.readingTime;
      wordCount = stats.words;
    }

    const updateData = {
      title: req.body.title || blog.title,
      slug: req.body.title ? slugify(req.body.title, { lower: true, strict: true }) : blog.slug,
      content: req.body.content || blog.content,
      excerpt: req.body.excerpt || blog.excerpt,
      metaTitle: req.body.metaTitle || blog.metaTitle,
      metaDescription: req.body.metaDescription || blog.metaDescription,
      metaKeywords: req.body.metaKeywords || blog.metaKeywords,
      tags,
      coverImage: req.file ? req.file.path : blog.coverImage, // <-- Cloudinary URL
      privacy: req.body.privacy || blog.privacy,
      status: req.body.status || blog.status,
      readingTime,
      wordCount,
      isFeatured: typeof req.body.isFeatured !== "undefined" ? req.body.isFeatured === "true" : blog.isFeatured,
      author
    };

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating blog",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};


// ---------------- Delete Blog (Admin) ----------------
exports.deleteBlog = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    await blog.deleteOne();
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting blog", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// ---------------- Feature Blog (Admin) ----------------
exports.featureBlog = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    const isFeatured = req.body.isFeatured === true || req.body.isFeatured === "true";
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isFeatured, featuredAt: isFeatured ? new Date() : null },
      { new: true }
    );

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.status(200).json({ message: `Blog ${blog.isFeatured ? "featured" : "unfeatured"} successfully`, blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error featuring blog" });
  }
};

// ---------------- Like a Blog (User/Admin Unified) ----------------
exports.likeBlog = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    const userId = isAdmin ? req.admin._id : req.user?._id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const blog = await Blog.findById(req.params.id).populate("likes", "_id name avatar");
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const isLiked = blog.likes.some(u => u._id.toString() === userId.toString());
    if (isLiked) blog.likes = blog.likes.filter(u => u._id.toString() !== userId.toString());
    else blog.likes.push(userId);

    await blog.save();
    await blog.populate("likes", "_id name avatar");

    res.status(200).json({ message: isLiked ? "Blog unliked" : "Blog liked", likes: blog.likes, currentUserId: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error liking blog" });
  }
};

// ---------------- Comment/Reply on a Blog (User/Admin Unified) ----------------
exports.commentOnBlog = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    const userId = isAdmin ? req.admin._id : req.user?._id;
    const userName = isAdmin ? req.admin.name : req.user?.name || "Anonymous";
    const userAvatar = isAdmin ? req.admin.avatar : req.user?.avatar || null;

    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { text } = req.body;
    if (!text || text.trim() === "") return res.status(400).json({ message: "Comment text is required" });

    const blogId = req.params.id || req.params.blogId;
    const commentId = req.params.commentId;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (commentId) {
      // Reply to a comment
      const parentComment = blog.comments.id(commentId);
      if (!parentComment) return res.status(404).json({ message: "Parent comment not found" });

      const reply = { user: { id: userId, name: userName, avatar: userAvatar }, text: text.trim(), createdAt: new Date() };
      parentComment.replies = parentComment.replies || [];
      parentComment.replies.push(reply);
      await blog.save();
      res.status(201).json({ message: "Reply added successfully", reply });
    } else {
      // New comment
      const comment = { user: { id: userId, name: userName, avatar: userAvatar }, text: text.trim(), createdAt: new Date(), replies: [] };
      blog.comments.push(comment);
      await blog.save();
      res.status(201).json({ message: "Comment added successfully", comment });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding comment/reply" });
  }
};
