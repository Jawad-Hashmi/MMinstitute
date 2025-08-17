// models/blog_model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      maxlength: 300,
    },
    metaTitle: {
      type: String,
      maxlength: 60,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
    metaKeywords: [String],

 author: {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true,
      validate: [isValidEmail, 'Invalid email format'] // Simple email validation
    },
    avatar: { type: String, default: null }
  },

    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    

    coverImage: {
      type: String,
    },

    tags: [String],

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [{
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    avatar: String
  },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}],
     createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },

    readingTime: {
      type: Number,
    },

    wordCount: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

blogSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  const words = this.content.trim().split(/\s+/).length;
  this.wordCount = words;
  this.readingTime = Math.ceil(words / 200);

  if (!this.excerpt) {
    this.excerpt = this.content.substring(0, 300) + "...";
  }

  next();
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
