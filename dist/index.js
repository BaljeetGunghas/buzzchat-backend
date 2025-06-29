"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const server_1 = __importDefault(require("./server")); // your Express app
const User_1 = require("./models/User");
// 2. Create HTTP server from Express app
const httpServer = (0, http_1.createServer)(server_1.default);
// 3. Setup Socket.IO with CORS config
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
});
exports.io = io;
// Map to keep track of userId to socket.id 
const onlineUsers = new Map();
io.on("connection", async (socket) => {
    const broadcastOnlineUsers = async () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        console.log(onlineUserIds);
        io.emit("online_users", onlineUserIds);
    };
    socket.on("join", async (userId) => {
        socket.userId = userId;
        console.log(userId);
        onlineUsers.set(userId, socket.id);
        try {
            await User_1.User.updateOne({ _id: userId }, { status: "online" });
            console.log(`User ${userId} marked as online`);
            await broadcastOnlineUsers();
            socket.broadcast.emit("user_status_change", {
                userId,
                status: "online",
            });
        }
        catch (error) {
            console.error("Failed to update online status:", error);
        }
    });
    socket.on("disconnect", async () => {
        if (!socket.userId)
            return;
        console.log(socket.userId);
        onlineUsers.delete(socket.userId);
        try {
            await User_1.User.updateOne({ _id: socket.userId }, { status: "offline" });
            console.log(`User ${socket.userId} marked as offline`);
            await broadcastOnlineUsers();
            // ✅ Notify others
            socket.broadcast.emit("user_status_change", {
                userId: socket.userId,
                status: "offline",
            });
        }
        catch (error) {
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
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})
    .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
});
