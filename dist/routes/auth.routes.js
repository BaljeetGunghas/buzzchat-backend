"use strict";
// import { forgotPassword, loginUser, registerUser } from '../controllers/auth.controller';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middlewares/auth");
const auth_controller_1 = require("../controllers/auth.controller");
const express_1 = require("express");
const uploadMiddleware_1 = __importDefault(require("../Helper/uploadMiddleware"));
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.registerUser);
router.post('/login', auth_controller_1.loginUser);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.put("/profile-update", auth_1.authMiddleware, uploadMiddleware_1.default.single("profile_picture"), auth_controller_1.updateProfile);
router.post("/logoutUser", auth_1.authMiddleware, auth_controller_1.logoutUser);
exports.default = router;
