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
const socket_1 = require("./sockets/socket");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 2. Create HTTP server from Express app
const httpServer = (0, http_1.createServer)(server_1.default);
const allowedOrigins = [
    process.env.FRONTEND_URL || "https://buzzzchat.netlify.app", // ✅ Remove trailing slash
    /^http:\/\/localhost:\d+$/ // ✅ Allow all localhost ports
];
// 3. Setup Socket.IO with CORS config
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
});
exports.io = io;
// ✅ Setup socket events
(0, socket_1.setupSocket)(io);
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
