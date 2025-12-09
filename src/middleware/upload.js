// src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

// --------------------
// Ensure folders exist
// --------------------
const avatarFolder = path.join("src/uploads/profilePic");
const bannerFolder = path.join("src/uploads/eventBanners");
const postFolder = path.join("src/uploads/posts");

// Create folder if missing
[avatarFolder, bannerFolder, postFolder].forEach(folder => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
});

// --------------------
// Storage configurations
// --------------------

// Avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-avatar${ext}`);
  }
});

// Event banner upload
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, bannerFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-banner${ext}`);
  }
});

// Post image upload
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, postFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-post${ext}`);
  }
});

// --------------------
// File filter (only images)
// --------------------
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

// --------------------
// Exported upload middlewares
// --------------------
export const uploadAvatar = multer({ storage: avatarStorage, fileFilter: imageFileFilter });
export const uploadBanner = multer({ storage: bannerStorage, fileFilter: imageFileFilter });
export const uploadPostImage = multer({ storage: postStorage, fileFilter: imageFileFilter });

// --------------------
// DEFAULT EXPORT (For postsRoutes.js)
// --------------------
export default uploadPostImage;





