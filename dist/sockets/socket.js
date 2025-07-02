"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
// src/socket.ts or ./socket.ts
const User_1 = require("../models/User");
// Maintain userId to Set of socket ids
const onlineUsers = new Map();
const setupSocket = (io) => {
    const broadcastOnlineUsers = () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online_users", onlineUserIds);
    };
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on("join", async (userId) => {
            socket.userId = userId;
            console.log(socket.userId);
            const existingSockets = onlineUsers.get(userId) || new Set();
            existingSockets.add(socket.id);
            onlineUsers.set(userId, existingSockets);
            try {
                await User_1.User.updateOne({ _id: userId }, { status: "online" });
                console.log(`User ${userId} marked as online`);
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
                    console.log(`User ${socket.userId} marked as offline`);
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
        socket.emit("online_users", Array.from(onlineUsers.keys()));
        socket.on("send_message", (message) => {
            const { receiverId } = message;
            const receiverSockets = onlineUsers.get(receiverId);
            if (receiverSockets) {
                receiverSockets.forEach((sid) => {
                    io.to(sid).emit("receive_message", message);
                });
            }
        });
    });
};
exports.setupSocket = setupSocket;
