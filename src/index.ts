import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import app from "./server"; // your Express app

interface MessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
  conversationId: string;
  createdAt?: string;
}

// 2. Create HTTP server from Express app
const httpServer = createServer(app);

// 3. Setup Socket.IO with CORS config
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  },
});

// Map to keep track of userId to socket.id (optional)
const onlineUsers = new Map<string, string>();

// Handle socket connections
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("join", (userId: string) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on("send_message", (data: MessagePayload) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(receiverId).emit("receive_message", data);
      console.log(`Message sent to user ${receiverId}`);
    } else {
      io.emit("receive_message", data);
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
        console.log(`User ${key} disconnected and removed from online users`);
      }
    });
    console.log("❌ Client disconnected:", socket.id);
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/buzzchat";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

export { io };
