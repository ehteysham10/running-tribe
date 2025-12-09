import { io as Client } from "socket.io-client";

// Replace with your running backend URL
const SOCKET_URL = "http://localhost:5000";

// Replace these JWT tokens with actual tokens from your auth system
const tokenUserA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjk3NjYzODFhNzVhNDgyYmM3YzI1NCIsImVtYWlsIjoiaWFtZWh0aXNoYW0xMEBnbWFpbC5jb20iLCJpYXQiOjE3NjQ4MzA4MDcsImV4cCI6MTc2NTQzNTYwN30.lUSawM1Rbvzu6RSnAl3lJsjr3AxkV8WfpdkpyvpbGKg";
const tokenUserB = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzAzNTBkNTc3YWZlN2I1OWE3YzE3YiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NDgzMDk2NSwiZXhwIjoxNzY1NDM1NzY1fQ.nh5UQbQL4CaeUnHHvspd1ailFmmRw5mtwUSLlJ3hH4g";

// User IDs (MongoDB _id) of users A and B
const userAId = "6929766381a75a482bc7c254";
const userBId = "6930350d577afe7b59a7c17b";

const userASocket = Client(SOCKET_URL);
const userBSocket = Client(SOCKET_URL);

function setupSocket(socket, token, otherUserId, name) {
  socket.on("connect", () => {
    console.log(`${name} connected with id ${socket.id}`);
    // Authenticate
    socket.emit("authenticate", token);

    // Join chat room with the other user
    socket.emit("join_room", { otherUserId });
  });

  socket.on("receive_message", (msg) => {
    console.log(`${name} received message:`, msg.message);
  });

  socket.on("disconnect", () => {
    console.log(`${name} disconnected`);
  });
}

// Setup both sockets
setupSocket(userASocket, tokenUserA, userBId, "UserA");
setupSocket(userBSocket, tokenUserB, userAId, "UserB");

// Send messages after a delay
setTimeout(() => {
  userASocket.emit("send_message", {
    receiverId: userBId,
    message: "Hello from User A!",
  });
}, 2000);

setTimeout(() => {
  userBSocket.emit("send_message", {
    receiverId: userAId,
    message: "Hi User A, this is User B!",
  });
}, 4000);






