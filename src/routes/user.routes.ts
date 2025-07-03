// src/routes/user.routes.ts
import { Router } from 'express';
import { getAllUsers, getUserById, getOnlineUsers, searchUsersByName } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();


// search user by there name
router.get("/searchbyname", authMiddleware, searchUsersByName);

// Get currently online users (optional)
router.post('/status/online', authMiddleware, getOnlineUsers);


// Get a specific user by ID
router.get('/:id', authMiddleware, getUserById);

// Get all users (for search/chat list)
router.get('/', authMiddleware, getAllUsers);
export default router;
