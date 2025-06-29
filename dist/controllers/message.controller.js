"use strict";
// src/controllers/messageController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesByConversationId = exports.sendMessage = void 0;
const Message_1 = require("../models/Message");
const resFormat_1 = require("../utils/resFormat");
const Conversation_1 = require("../models/Conversation");
const index_1 = require("../index"); // adjust path as needed
const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        if (!senderId || !receiverId || !content) {
            return res.status(400).json((0, resFormat_1.resFormat)(400, 'Missing required fields', null, 0));
        }
        // Find or create conversation
        let conversation = await Conversation_1.Conversation.findOne({
            participants: { $all: [senderId.trim(), receiverId.trim()] },
        });
        if (!conversation) {
            conversation = new Conversation_1.Conversation({ participants: [senderId, receiverId] });
            await conversation.save();
        }
        const message = new Message_1.Message({
            senderId,
            receiverId,
            conversationId: conversation._id,
            content,
        });
        await message.save();
        // Emit message ONLY to receiver room
        index_1.io.to(receiverId).emit('receive_message', {
            _id: message._id,
            senderId,
            receiverId,
            content,
            conversationId: conversation._id,
            createdAt: message.createdAt,
        });
        res.status(201).json((0, resFormat_1.resFormat)(201, 'Message sent', { message, conversationId: conversation._id }));
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.sendMessage = sendMessage;
// Get all messages for a conversation
const getMessagesByConversationId = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message_1.Message.find({ conversationId }).sort({ createdAt: 1 });
        res.status(200).json((0, resFormat_1.resFormat)(200, 'Messages fetched successfully', messages));
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.getMessagesByConversationId = getMessagesByConversationId;
