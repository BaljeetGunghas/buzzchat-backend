// src/socket.ts or ./socket.ts
import { User } from "../models/User";
import { Server as SocketIOServer, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface CustomSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
    userId?: string;
}

// Maintain userId to Set of socket ids
const onlineUsers = new Map<string, Set<string>>();

export const setupSocket = (io: SocketIOServer) => {
    const broadcastOnlineUsers = () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online_users", onlineUserIds);
    };

    io.on("connection", (socket: CustomSocket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join", async (userId: string) => {
            socket.userId = userId;
            console.log(socket.userId);

            const existingSockets = onlineUsers.get(userId) || new Set<string>();
            existingSockets.add(socket.id);
            onlineUsers.set(userId, existingSockets);

            try {
                await User.updateOne({ _id: userId }, { status: "online" });
                console.log(`User ${userId} marked as online`);
                broadcastOnlineUsers();

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

            const userSockets = onlineUsers.get(socket.userId);
            if (!userSockets) return;

            userSockets.delete(socket.id);

            if (userSockets.size === 0) {
                onlineUsers.delete(socket.userId);

                try {
                    await User.updateOne({ _id: socket.userId }, { status: "offline" });
                    console.log(`User ${socket.userId} marked as offline`);
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
