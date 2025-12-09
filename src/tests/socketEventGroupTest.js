import { io } from "socket.io-client";

// -------------------------
// Configuration
// -------------------------
const SOCKET_URL = "http://localhost:5000";

// Replace with JWTs of event participants
const TOKEN_USER_A = "<JWT_OF_USER_A>";
const TOKEN_USER_B = "<JWT_OF_USER_B>";
const TOKEN_USER_C = "<JWT_OF_USER_C>";

// Event ID (use any existing event with participants)
const EVENT_ID = "<EVENT_OBJECT_ID>";

// Helper to create a socket connection
const connectUser = (token, name) => {
  const socket = io(SOCKET_URL);

  socket.on("connect", () => {
    console.log(`${name} connected with socket id:`, socket.id);

    // Authenticate user
    socket.emit("authenticate", token);

    // Join event group room
    socket.emit("join_room", { eventRoomId: EVENT_ID });

    // Send a message after joining
    if (name === "User A") {
      setTimeout(() => {
        socket.emit("send_message", {
          eventRoomId: EVENT_ID,
          message: "Hello everyone from User A!"
        });
      }, 1000);
    }
  });

  // Listen for messages
  socket.on("receive_message", (msg) => {
    console.log(`${name} received message:`, msg.message);
  });

  return socket;
};

// -------------------------
// Connect all participants
// -------------------------
const userA = connectUser(TOKEN_USER_A, "User A");
const userB = connectUser(TOKEN_USER_B, "User B");
const userC = connectUser(TOKEN_USER_C, "User C");
