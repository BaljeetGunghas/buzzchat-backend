"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
// src/socket.ts
const User_1 = require("../models/User");
const Message_1 = require("../models/Message");
const onlineUsers = new Map();
const setupSocket = (io) => {
    const broadcastOnlineUsers = () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online_users", onlineUserIds);
    };
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // Join
        socket.on("join", async (userId) => {
            socket.userId = userId;
            const existingSockets = onlineUsers.get(userId) || new Set();
            existingSockets.add(socket.id);
            onlineUsers.set(userId, existingSockets);
            try {
                await User_1.User.updateOne({ _id: userId }, { status: "online" });
                broadcastOnlineUsers();
                socket.broadcast.emit("user_status_change", {
                    userId,
                    status: "online",
                });
            }
            catch (error) {
                console.error("Failed to update online status:", error);
            }
        });
        // Disconnect
        socket.on("disconnect", async () => {
            if (!socket.userId)
                return;
            const userSockets = onlineUsers.get(socket.userId);
            if (!userSockets)
                return;
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
                onlineUsers.delete(socket.userId);
                try {
                    await User_1.User.updateOne({ _id: socket.userId }, { status: "offline" });
                    broadcastOnlineUsers();
                    socket.broadcast.emit("user_status_change", {
                        userId: socket.userId,
                        status: "offline",
                    });
                }
                catch (error) {
                    console.error("Failed to update offline status:", error);
                }
            }
            else {
                broadcastOnlineUsers();
            }
        });
        // Send message
        socket.on("send_message", (message) => {
            const { receiverId } = message;
            const receiverSockets = onlineUsers.get(receiverId);
            if (receiverSockets) {
                receiverSockets.forEach((sid) => {
                    io.to(sid).emit("receive_message", message);
                });
            }
        });
        // ✅ Mark messages as read
        socket.on("mark_as_read", async ({ conversationId, userId }) => {
            console.log(conversationId, userId);
            try {
                await Message_1.Message.updateMany({ conversationId, receiverId: userId, isRead: false }, { $set: { isRead: true } });
                // Optionally: notify sender(s) that messages were read
                io.emit("messages_read", { conversationId, userId });
            }
            catch (err) {
                console.error("Failed to mark messages as read:", err);
            }
        });
        // Initial emit of online users
        socket.emit("online_users", Array.from(onlineUsers.keys()));
    });
};
exports.setupSocket = setupSocket;
