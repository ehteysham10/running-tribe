
import express from "express";
import auth from "../middleware/auth.js";
import uploadPostImage from "../middleware/upload.js";
import { requirePremiumForFeature } from "../middleware/membership.js";
import {
  createPost,
  getAllPosts,
  likePost,
  addComment,
  getPostById,
  updatePost,
  deletePost,
  deleteComment
} from "../controllers/postController.js";

const router = express.Router();

// -------------------------------
// CREATE POST → Basic users limited by daily post, premium unrestricted
// -------------------------------
router.post("/", auth, uploadPostImage.single("image"), createPost);

// -------------------------------
// UPDATE POST → Only post owner
// -------------------------------
router.put("/:postId", auth, uploadPostImage.single("image"), updatePost);

// -------------------------------
// DELETE POST → Only post owner
// -------------------------------
router.delete("/:postId", auth, deletePost);

// -------------------------------
// PUBLIC ROUTES
// -------------------------------
router.get("/", getAllPosts);
router.get("/:postId", getPostById);

// -------------------------------
// AUTH ROUTES
// -------------------------------
router.put("/like/:postId", auth, likePost);

// COMMENT → PREMIUM ONLY
router.post("/comment/:postId", auth, requirePremiumForFeature, addComment);

// DELETE COMMENT → Only comment owner or post owner
router.delete("/comment/:postId/:commentId", auth, deleteComment);

export default router;
