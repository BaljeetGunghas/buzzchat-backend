import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import app from "./server"; // your Express app
import { User } from "./models/User";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";


interface CustomSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  userId?: string;
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

// Map to keep track of userId to socket.id 
const onlineUsers = new Map<string, string>();

io.on("connection", async (socket: CustomSocket) => {


  const broadcastOnlineUsers = async () => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    console.log(onlineUserIds);
    io.emit("online_users", onlineUserIds);
  };

  socket.on("join", async (userId: string) => {
    socket.userId = userId;
    console.log(userId);

    onlineUsers.set(userId, socket.id);

    try {
      await User.updateOne({ _id: userId }, { status: "online" });
      console.log(`User ${userId} marked as online`);
      await broadcastOnlineUsers();

      socket.broadcast.emit("user_status_change", {
        userId,
        status: "online",
      });
    } catch (error) {
      console.error("Failed to update online status:", error);
    }
  });

  socket.on("disconnect", async () => {
    if (!socket.userId) return;

    console.log(socket.userId);

    onlineUsers.delete(socket.userId);

    try {
      await User.updateOne({ _id: socket.userId }, { status: "offline" });
      console.log(`User ${socket.userId} marked as offline`);
      await broadcastOnlineUsers();

      // ✅ Notify others
      socket.broadcast.emit("user_status_change", {
        userId: socket.userId,
        status: "offline",
      });
    } catch (error) {
      console.error("Failed to update offline status:", error);
    }
  });

  socket.emit("online_users", Array.from(onlineUsers.keys()));

  // Handle message
  socket.on("send_message", (message) => {
    const { receiverId } = message;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", message);
    }
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
