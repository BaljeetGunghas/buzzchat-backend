import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getMessagesByConversationId,
  sendMessage,
} from '../controllers/message.controller';

const router = Router();

// POST a new message
router.post('/send', authMiddleware, sendMessage);

// GET all messages for a conversation
router.get('/:conversationId', authMiddleware, getMessagesByConversationId);


export default router;
