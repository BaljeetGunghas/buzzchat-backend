"use strict";
// src/controllers/conversationController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserChatList = exports.getUserConversations = exports.getOrCreateConversation = void 0;
const Conversation_1 = require("../models/Conversation");
const resFormat_1 = require("../utils/resFormat");
const Message_1 = require("../models/Message");
// Create or get conversation between two users
const getOrCreateConversation = async (req, res) => {
    try {
        const senderId = req.body.senderId?.trim();
        const receiverId = req.body.receiverId?.trim();
        if (!senderId || !receiverId) {
            return res.status(400).json((0, resFormat_1.resFormat)(400, 'SenderId and ReceiverId are required', null, 0));
        }
        // Check if conversation exists
        let conversation = await Conversation_1.Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });
        if (!conversation) {
            // Create new conversation
            conversation = new Conversation_1.Conversation({ participants: [senderId, receiverId] });
            const savedConv = await conversation.save();
            console.log(savedConv);
        }
        res.status(200).json((0, resFormat_1.resFormat)(200, 'Conversation fetched/created successfully', conversation));
    }
    catch (error) {
        console.error('Error creating/fetching conversation:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.getOrCreateConversation = getOrCreateConversation;
// Get all conversations for a user
const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = await Conversation_1.Conversation.find({
            participants: userId,
        }).populate('participants', '-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');
        // Filter out current user from participants in each conversation
        const formatted = conversations.map((conv) => {
            const otherParticipants = conv.participants.filter((p) => p._id.toString() !== userId);
            return {
                _id: conv._id,
                participants: otherParticipants,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
            };
        });
        res.status(200).json((0, resFormat_1.resFormat)(200, 'Conversations fetched successfully', formatted));
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.getUserConversations = getUserConversations;
const getUserChatList = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = await Conversation_1.Conversation.find({
            participants: userId,
        })
            .populate("participants", "-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires")
            .lean();
        const formattedConversations = await Promise.all(conversations.map(async (conv) => {
            const otherParticipants = conv.participants.filter((p) => p._id.toString() !== userId);
            const lastMessage = await Message_1.Message.findOne({ conversationId: conv._id })
                .sort({ createdAt: -1 })
                .lean();
            const sentByMe = lastMessage?.senderId.toString() === userId;
            return {
                _id: conv._id,
                participants: otherParticipants[0], // only one other participant
                lastMessage: lastMessage?.content || null,
                lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
                isRead: lastMessage?.isRead ?? true,
                sentByMe, // ✅ indicates if the logged-in user sent the last message
            };
        }));
        // Sort by lastMessageTime descending
        formattedConversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        res.status(200).json((0, resFormat_1.resFormat)(200, "Conversations fetched successfully", formattedConversations));
    }
    catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json((0, resFormat_1.resFormat)(500, "Server error", null, 0));
    }
};
exports.getUserChatList = getUserChatList;
