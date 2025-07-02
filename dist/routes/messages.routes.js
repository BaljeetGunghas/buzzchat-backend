"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const message_controller_1 = require("../controllers/message.controller");
const router = (0, express_1.Router)();
// POST a new message
router.post('/send', auth_1.authMiddleware, message_controller_1.sendMessage);
// GET all messages for a conversation
router.get('/:conversationId', auth_1.authMiddleware, message_controller_1.getMessagesByConversationId);
exports.default = router;
