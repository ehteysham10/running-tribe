



// src/routes/userRoutes.js
import express from "express";
import auth from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import {
  getMe,
  updateMe,
  getUserById,
  saveFcmToken,
  upgradeToPremium
} from "../controllers/userController.js";

const router = express.Router();

// Get current user
router.get("/me", auth, getMe);

// Get user by ID (public)
router.get("/:id", getUserById);

// Update current user profile with avatar
router.patch("/me", auth, uploadAvatar.single("avatar"), updateMe);

// Save FCM token
router.post("/fcm-token", auth, saveFcmToken);
router.post("/upgrade-to-premium", auth, upgradeToPremium);

export default router;
