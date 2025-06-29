"use strict";
// src/routes/conversation.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversation_controller_1 = require("../controllers/conversation.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Get all conversations for a user
router.get('/:userId', auth_1.authMiddleware, conversation_controller_1.getUserConversations);
router.get('/chat-list/:userId', auth_1.authMiddleware, conversation_controller_1.getUserChatList);
exports.default = router;
