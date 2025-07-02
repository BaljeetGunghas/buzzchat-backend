"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Get all users (for search/chat list)
router.get('/', auth_1.authMiddleware, user_controller_1.getAllUsers);
// Get a specific user by ID
router.get('/:id', auth_1.authMiddleware, user_controller_1.getUserById);
// Get currently online users (optional)
router.post('/status/online', auth_1.authMiddleware, user_controller_1.getOnlineUsers);
exports.default = router;
