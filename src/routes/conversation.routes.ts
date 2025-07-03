// src/routes/conversation.routes.ts

import { Router } from 'express';
import {
  getUserChatList,
  getUserConversations
} from '../controllers/conversation.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Get all conversations for a user
router.get('/:userId', authMiddleware, getUserConversations);

router.get('/chat-list/:userId', authMiddleware, getUserChatList)

export default router;
