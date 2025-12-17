
import express from "express";
import auth from "../middleware/auth.js";
import { requirePremiumForFeature } from "../middleware/membership.js";
import {
  sendMessage,
  getMessages,
  markAsRead,
  sendEventMessage,
  getEventMessages,
  markEventMessagesRead
} from "../controllers/messageController.js";

const router = express.Router();

// -----------------------------
// PRIVATE 1:1 routes
// -----------------------------
router.post("/send", auth, requirePremiumForFeature, sendMessage); // premium only
router.get("/history/:otherUserId", auth, getMessages);
router.patch("/mark-read/:otherUserId", auth, markAsRead);

// -----------------------------
// EVENT (group) routes
// -----------------------------
router.post("/send-event", auth, requirePremiumForFeature, sendEventMessage); // premium only
router.get("/event/:eventId", auth, getEventMessages);
router.patch("/event-mark-read/:eventId", auth, markEventMessagesRead);

export default router;
