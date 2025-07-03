// src/socket.ts
import { User } from "../models/User";
import { Message } from "../models/Message";
import { Server as SocketIOServer, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface CustomSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
    userId?: string;
}

const onlineUsers = new Map<string, Set<string>>();

export const setupSocket = (io: SocketIOServer) => {
    const broadcastOnlineUsers = () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online_users", onlineUserIds);
    };

    io.on("connection", (socket: CustomSocket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join
        socket.on("join", async (userId: string) => {
            socket.userId = userId;
            const existingSockets = onlineUsers.get(userId) || new Set<string>();
            existingSockets.add(socket.id);
            onlineUsers.set(userId, existingSockets);

            try {
                await User.updateOne({ _id: userId }, { status: "online" });
                broadcastOnlineUsers();
                socket.broadcast.emit("user_status_change", {
                    userId,
                    status: "online",
                });
            } catch (error) {
                console.error("Failed to update online status:", error);
            }
        });

        // Disconnect
        socket.on("disconnect", async () => {
            if (!socket.userId) return;

            const userSockets = onlineUsers.get(socket.userId);
            if (!userSockets) return;

            userSockets.delete(socket.id);

            if (userSockets.size === 0) {
                onlineUsers.delete(socket.userId);
                try {
                    await User.updateOne({ _id: socket.userId }, { status: "offline" });
                    broadcastOnlineUsers();
                    socket.broadcast.emit("user_status_change", {
                        userId: socket.userId,
                        status: "offline",
                    });
                } catch (error) {
                    console.error("Failed to update offline status:", error);
                }
            } else {
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
            console.log(conversationId,userId);
            
            try {
                await Message.updateMany(
                    { conversationId, receiverId: userId, isRead: false },
                    { $set: { isRead: true } }
                );

                // Optionally: notify sender(s) that messages were read
                io.emit("messages_read", { conversationId, userId });
            } catch (err) {
                console.error("Failed to mark messages as read:", err);
            }
        });

        // Initial emit of online users
        socket.emit("online_users", Array.from(onlineUsers.keys()));
    });
};
