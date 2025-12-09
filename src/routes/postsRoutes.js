import express from "express";
import auth from "../middleware/auth.js";
import uploadPostImage from "../middleware/upload.js";

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
// CREATE POST (text + optional image)
// -------------------------------
router.post(
  "/",
  auth,
  uploadPostImage.single("image"),
  createPost
);

// -------------------------------
// UPDATE POST (ONLY OWNER, text + optional image)
// -------------------------------
router.put(
  "/:postId",
  auth,
  uploadPostImage.single("image"),
  updatePost
);

//delete post

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
router.post("/comment/:postId", auth, addComment);
router.delete("/comment/:postId/:commentId", auth, deleteComment);

export default router;
