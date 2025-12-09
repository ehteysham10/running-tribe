
import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
  sendEventMessage,
  getEventMessages,
  markEventMessagesRead
} from "../controllers/messageController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Private 1:1 routes
router.post("/send", auth, sendMessage);
router.get("/history/:otherUserId", auth, getMessages);
router.patch("/mark-read/:otherUserId", auth, markAsRead);

// Event (group) routes
router.post("/send-event", auth, sendEventMessage);
router.get("/event/:eventId", auth, getEventMessages);
router.patch("/event-mark-read/:eventId", auth, markEventMessagesRead);

export default router;
