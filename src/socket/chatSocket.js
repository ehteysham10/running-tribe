
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Event from "../models/Event.js";
import { getRoomId } from "../controllers/messageController.js";

/**
 * Initialize chat socket
 * @param {SocketIO.Server} io 
 */
export const initChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    // ------------------------
    // Authenticate user from JWT
    // ------------------------
    socket.on("authenticate", (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        console.log(`Socket ${socket.id} authenticated as user ${socket.userId}`);
      } catch (err) {
        console.log("Invalid token for socket " + socket.id);
        socket.disconnect();
      }
    });

    // ------------------------
    // Join room (1:1 or event group)
    // ------------------------
    socket.on("join_room", ({ otherUserId, eventRoomId }) => {
      if (!socket.userId) return;

      let roomId;
      if (eventRoomId) {
        roomId = eventRoomId; // Event group
      } else if (otherUserId) {
        roomId = getRoomId(socket.userId, otherUserId); // 1-to-1
      } else {
        return;
      }

      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    // ------------------------
    // Send message (1:1 or event group)
    // ------------------------
    socket.on("send_message", async ({ receiverId, message, eventRoomId }) => {
      if (!socket.userId || !message) return;

      let roomId;
      let receiver = receiverId || null;

      if (eventRoomId) {
        roomId = eventRoomId; // Event group
      } else if (receiverId) {
        roomId = getRoomId(socket.userId, receiverId); // 1-to-1
      } else {
        return;
      }

      try {
        const newMessage = await Message.create({
          roomId,
          sender: socket.userId,
          receiver,
          message,
          event: eventRoomId || null,
          roomType: eventRoomId ? "event" : "private",
        });

        io.to(roomId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("Error sending message:", err.message);
      }
    });

    // ------------------------
    // Join event room
    // client emits: socket.emit("join_event_room", { eventId })
    // ------------------------
    socket.on("join_event_room", async ({ eventId }) => {
      if (!socket.userId || !eventId) return;
      try {
        const event = await Event.findById(eventId).select("participants created_by");
        if (!event) return;

        const isParticipant = event.participants.some(p => String(p) === String(socket.userId));
        const isCreator = String(event.created_by) === String(socket.userId);
        if (!isParticipant && !isCreator) return;

        const roomId = `event_${eventId}`;
        socket.join(roomId);
        console.log(`User ${socket.userId} joined event room ${roomId}`);
      } catch (err) {
        console.error("Error on join_event_room:", err.message);
      }
    });

    // ------------------------
    // Send event message
    // client emits: socket.emit("send_event_message", { eventId, message })
    // ------------------------
    socket.on("send_event_message", async ({ eventId, message }) => {
      if (!socket.userId || !eventId || !message) return;
      try {
        const event = await Event.findById(eventId).select("participants created_by");
        if (!event) return;

        const isParticipant = event.participants.some(p => String(p) === String(socket.userId));
        const isCreator = String(event.created_by) === String(socket.userId);
        if (!isParticipant && !isCreator) return;

        const roomId = `event_${eventId}`;

        const newMessage = await Message.create({
          roomId,
          roomType: "event",
          event: eventId,
          sender: socket.userId,
          receiver: null,
          message,
        });

        io.to(roomId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("Error sending event message:", err.message);
      }
    });

    // ------------------------
    // Disconnect
    // ------------------------
    socket.on("disconnect", () => {
      console.log("Client disconnected: " + socket.id);
    });
  });
};
