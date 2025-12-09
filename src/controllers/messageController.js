
// src/controllers/messageController.js

import Message from "../models/Message.js";
import Event from "../models/Event.js";
import User from "../models/User.js"; // ⬅️ Needed for FCM tokens
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";

import {
  sendPushNotification,
} from "../services/notificationService.js";

// Utility: create stable roomId using sorted user IDs
const getRoomId = (user1, user2) => {
  const ids = [user1.toString(), user2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

// -----------------------------
// PRIVATE: Send message (1:1)
// POST /api/messages/send
// -----------------------------
export const sendMessage = asyncHandler(async (req, res) => {
  // BLOCK basic users
  if (req.user.membership === "basic") {
    return res.status(403).json({ msg: "Upgrade to premium to send messages." });
  }

  const sender = req.user._id;
  const { receiver, message } = req.body;

  if (!receiver || !message) {
    return res.status(400).json({ msg: "Receiver & message are required" });
  }

  const roomId = getRoomId(sender, receiver);

  const newMessage = await Message.create({
    roomId,
    roomType: "private",
    sender,
    receiver,
    message,
  });

  // -----------------------------------------
  // 🔔 PUSH NOTIFICATION: 1:1 Chat
  // -----------------------------------------
  try {
    const receiverUser = await User.findById(receiver);

    if (receiverUser?.fcmToken) {
      await sendPushNotification(
        receiverUser.fcmToken,
        `${req.user.name} sent you a message`,
        message || "You received a new message",
        {
          type: "chat",
          senderId: String(sender),
          receiverId: String(receiver),
        }
      );
    }
  } catch (err) {
    console.error("❌ Failed to send chat push notification:", err);
  }

  res.status(201).json({
    success: true,
    data: newMessage,
  });
});

// -----------------------------
// PRIVATE: Get message history between two users
// GET /api/messages/history/:otherUserId
// -----------------------------
export const getMessages = asyncHandler(async (req, res) => {
  const user1 = req.user._id;
  const user2 = req.params.otherUserId;

  const roomId = getRoomId(user1, user2);

  const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

// -----------------------------
// PRIVATE: Mark all messages from other user as read
// PATCH /api/messages/mark-read/:otherUserId
// -----------------------------
export const markAsRead = asyncHandler(async (req, res) => {
  const user1 = req.user._id;
  const user2 = req.params.otherUserId;

  const roomId = getRoomId(user1, user2);

  await Message.updateMany(
    { roomId, receiver: user1, isReadBy: { $ne: user1 } },
    { $push: { isReadBy: user1 } }
  );

  res.status(200).json({ success: true, msg: "Messages marked as read" });
});

// -----------------------------
// EVENT: Send group message to event participants
// POST /api/messages/send-event
// Body: { eventId, message }
// -----------------------------
export const sendEventMessage = asyncHandler(async (req, res) => {
  // BLOCK basic users
  if (req.user.membership === "basic") {
    return res.status(403).json({ msg: "Upgrade to premium to send messages." });
  }

  const sender = req.user._id;
  const { eventId, message } = req.body;

  if (!eventId || !message) {
    return res.status(400).json({ msg: "eventId & message are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ msg: "Invalid eventId" });
  }

  const event = await Event.findById(eventId).select("participants created_by");
  if (!event) return res.status(404).json({ msg: "Event not found" });

  // Only participants or the creator can send message to event room
  const isParticipant = event.participants.some(p => String(p) === String(sender));
  const isCreator = String(event.created_by) === String(sender);
  if (!isParticipant && !isCreator) {
    return res.status(403).json({ msg: "You are not a participant of this event" });
  }

  const roomId = `event_${eventId}`;

  const newMessage = await Message.create({
    roomId,
    roomType: "event",
    event: eventId,
    sender,
    message,
    receiver: null,
  });

  // -----------------------------------------
  // 🔔 PUSH NOTIFICATIONS: Event Group Message
  // -----------------------------------------
  try {
    const senderUser = await User.findById(sender);

    const participants = await User.find({
      _id: { $in: event.participants },
      _id: { $ne: sender },
    });

    for (const user of participants) {
      if (!user.fcmToken) continue;

      await sendPushNotification(
        user.fcmToken,
        `${senderUser.name} in ${eventId}`,
        message || "New message in event group",
        {
          type: "event_message",
          eventId: String(eventId),
          senderId: String(sender),
        }
      );
    }
  } catch (err) {
    console.error("❌ Failed to send event message notifications:", err);
  }

  res.status(201).json({ success: true, data: newMessage });
});

// -----------------------------
// EVENT: Get event message history
// GET /api/messages/event/:eventId
// -----------------------------
export const getEventMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ msg: "Invalid eventId" });
  }

  const event = await Event.findById(eventId).select("participants created_by");
  if (!event) return res.status(404).json({ msg: "Event not found" });

  // Only participants or creator can view event messages
  const isParticipant = event.participants.some(p => String(p) === String(userId));
  const isCreator = String(event.created_by) === String(userId);
  if (!isParticipant && !isCreator) {
    return res.status(403).json({ msg: "You are not a participant of this event" });
  }

  const roomId = `event_${eventId}`;

  const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

  res.status(200).json({ success: true, count: messages.length, data: messages });
});

// -----------------------------
// EVENT: Mark event messages as read for current user
// PATCH /api/messages/event-mark-read/:eventId
// -----------------------------
export const markEventMessagesRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ msg: "Invalid eventId" });
  }

  const event = await Event.findById(eventId).select("participants created_by");
  if (!event) return res.status(404).json({ msg: "Event not found" });

  const isParticipant = event.participants.some(p => String(p) === String(userId));
  const isCreator = String(event.created_by) === String(userId);
  if (!isParticipant && !isCreator) {
    return res.status(403).json({ msg: "You are not a participant of this event" });
  }

  const roomId = `event_${eventId}`;

  // Add userId to isReadBy array if not present
  await Message.updateMany(
    { roomId, isReadBy: { $ne: userId } },
    { $push: { isReadBy: userId } }
  );

  res.status(200).json({ success: true, msg: "Event messages marked as read" });
});

// Export utility for socket usage
export { getRoomId };
