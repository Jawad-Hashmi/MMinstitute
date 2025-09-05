const multer = require("multer");
const { storage } = require("./cloudinary"); // import the storage from your cloudinary.js file

// Optional: File filter (if you want extra validation)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = file.mimetype.split("/")[1]; // get mime type extension
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

// Multer upload using Cloudinary storage
const upload = multer({
  storage, // Cloudinary storage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter, // optional
});

module.exports = upload;
