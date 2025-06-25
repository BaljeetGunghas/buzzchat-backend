// src/controllers/conversationController.ts

import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { resFormat } from '../utils/resFormat';




// Create or get conversation between two users
export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const senderId = req.body.senderId?.trim();
    const receiverId = req.body.receiverId?.trim();
    if (!senderId || !receiverId) {
      return res.status(400).json(resFormat(400, 'SenderId and ReceiverId are required', null, 0));
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({ participants: [senderId, receiverId] });
      const savedConv = await conversation.save();
      console.log(savedConv);

    }

    res.status(200).json(resFormat(200, 'Conversation fetched/created successfully', conversation));
  } catch (error) {
    console.error('Error creating/fetching conversation:', error);
    res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};


// Get all conversations for a user
export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      participants: userId,
    }).populate(
      'participants',
      '-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires'
    );

    // Filter out current user from participants in each conversation
    const formatted = conversations.map((conv) => {
      const otherParticipants = conv.participants.filter((p: any) => p._id.toString() !== userId);
      return {
        _id: conv._id,
        participants: otherParticipants,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json(resFormat(200, 'Conversations fetched successfully', formatted));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};

