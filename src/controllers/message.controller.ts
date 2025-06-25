// src/controllers/messageController.ts

import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { resFormat } from '../utils/resFormat';
import { Conversation } from '../models/Conversation';
import { io } from '../index';  // adjust path as needed




export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json(resFormat(400, 'Missing required fields', null, 0));
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId.trim(), receiverId.trim()] },
    });

    if (!conversation) {
      conversation = new Conversation({ participants: [senderId, receiverId] });
      await conversation.save();
    }

    const message = new Message({
      senderId,
      receiverId,
      conversationId: conversation._id,
      content,
    });

    await message.save();

    // Emit message ONLY to receiver room
    io.to(receiverId).emit('receive_message', {
      _id: message._id,
      senderId,
      receiverId,
      content,
      conversationId: conversation._id,
      createdAt: message.createdAt,
    });

    res.status(201).json(resFormat(201, 'Message sent', { message, conversationId: conversation._id }));
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};


// Get all messages for a conversation
export const getMessagesByConversationId = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

        res.status(200).json(resFormat(200, 'Messages fetched successfully', messages));
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json(resFormat(500, 'Server error', null, 0));
    }
};




