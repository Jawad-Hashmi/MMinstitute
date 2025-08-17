const Blog = require("../models/blog_model");
const slugify = require("slugify");
const Admin = require("../models/admin_model");

// Utility for reading stats
const getReadingStats = (content) => {
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);
  return { words, readingTime };
};

// Create blog
exports.postBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      metaKeywords,
      tags,
      privacy,
      coverImage,
      status,
      author // New author field from request body
    } = req.body;

    // 1. Admin verification
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(403).json({ message: "Admin authentication failed" });
    }

    // 2. Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // 3. Author info validation
    if (!author?.name || !author?.email) {
      return res.status(400).json({ 
        message: "Author name and email are required in the author object" 
      });
    }

    // 4. Calculate reading stats
    const { words, readingTime } = getReadingStats(content);

    // 5. Create blog with all fields
    const blog = new Blog({
      title,
      slug: slugify(title, { lower: true, strict: true }),
      content,
      excerpt: excerpt || `${content.substring(0, 100)}...`, // Auto-generate if not provided
      metaTitle,
      metaDescription,
      metaKeywords,
      tags: tags || [], // Default empty array
      coverImage,
      readingTime,
      wordCount: words,
      author: { // From request body
        name: author.name,
        email: author.email,
        avatar: author.avatar || null
      },
      createdBy: admin._id // Track which admin created this
    });

    await blog.save();
    
    res.status(201).json({ 
      message: "Blog created successfully",
      blog: blog.toObject() 
    });
    
  } catch (error) {
    console.error("Blog creation error:", error);
    res.status(500).json({ 
      message: "Error creating blog",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get all published public blogs
exports.getBlogs = async (req, res) => {
  try {
    const { author } = req.query;
    const filter = { 
      privacy: "public", 
      status: "published" 
    };

    if (author) {
      filter['author.name'] = new RegExp(author, 'i');
    }

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching blogs" });
  }
};

// Get featured blogs
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      isFeatured: true,
      privacy: "public",
      status: "published"
    }).sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching featured blogs" });
  }
};

// Get single blog by slug
exports.getSingleBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // If private, only admin can view (since only admins can create)
    if (blog.privacy === "private" && !req.admin?.id) {
      return res.status(403).json({ message: "Access denied to this private blog" });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching blog" });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      metaKeywords,
      tags,
      privacy,
      coverImage,
      status,
      author, // Allow author updates
      isFeatured
    } = req.body;

    // Verify admin
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    let blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Update reading stats if content changes
    let readingTime = blog.readingTime;
    let wordCount = blog.wordCount;
    if (content) {
      const stats = getReadingStats(content);
      readingTime = stats.readingTime;
      wordCount = stats.words;
    }

    // Prepare update data
    const updateData = {
      title: title || blog.title,
      slug: title ? slugify(title, { lower: true, strict: true }) : blog.slug,
      content: content || blog.content,
      excerpt: excerpt || blog.excerpt,
      metaTitle: metaTitle || blog.metaTitle,
      metaDescription: metaDescription || blog.metaDescription,
      metaKeywords: metaKeywords || blog.metaKeywords,
      tags: tags || blog.tags,
      privacy: privacy || blog.privacy,
      coverImage: coverImage || blog.coverImage,
      status: status || blog.status,
      readingTime,
      wordCount,
      isFeatured: typeof isFeatured !== 'undefined' ? isFeatured : blog.isFeatured
    };

    // Update author info if provided
    if (author) {
      updateData.author = {
        name: author.name || blog.author.name,
        email: author.email || blog.author.email,
        avatar: author.avatar || blog.author.avatar
      };
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({ message: "Blog updated", blog: updatedBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating blog" });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    // Verify admin
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    await blog.deleteOne();
    res.status(200).json({ message: "Blog deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting blog" });
  }
};

// Feature blog (admin only)
exports.featureBlog = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(403).json({ message: "Admin authentication failed" });

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isFeatured: req.body.featured !== false }, // Defaults to true unless explicitly false
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.status(200).json({ 
      message: `Blog ${blog.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      blog 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error featuring blog" });
  }
};

// Like a blog (users only)
exports.likeBlog = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const userId = req.user._id;
    const isLiked = blog.likes.includes(userId);

    if (isLiked) {
      blog.likes.pull(userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();

    res.status(200).json({ 
      message: isLiked ? "Blog unliked" : "Blog liked",
      isLiked: !isLiked,
      likesCount: blog.likes.length 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error liking blog" });
  }
};

// Comment on a blog (users only)
exports.commentOnBlog = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = {
      user: {
        id: req.user._id,
        name: req.user.name || 'Anonymous',
        avatar: req.user.avatar || null
      },
      text,
      createdAt: new Date(),
    };

    blog.comments.push(comment);
    await blog.save();

    res.status(201).json({ 
      message: "Comment added", 
      comment 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding comment" });
  }
};