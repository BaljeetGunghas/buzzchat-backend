import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import app from "./server"; // your Express app
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { setupSocket } from "./sockets/socket";


interface CustomSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  userId?: string;
}

// 2. Create HTTP server from Express app
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || "https://buzzzchat.netlify.app", // ✅ Remove trailing slash
  /^http:\/\/localhost:\d+$/ // ✅ Allow all localhost ports
];

// 3. Setup Socket.IO with CORS config
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  },
});

// ✅ Setup socket events
setupSocket(io);

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
