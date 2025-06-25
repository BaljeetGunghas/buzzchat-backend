// src/routes/user.routes.ts
import { Router } from 'express';
import { getAllUsers, getUserById, getOnlineUsers } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Get all users (for search/chat list)
router.get('/', authMiddleware, getAllUsers);

// Get a specific user by ID
router.get('/:id', authMiddleware, getUserById);

// Get currently online users (optional)
router.get('/status/online', authMiddleware, getOnlineUsers);

export default router;
