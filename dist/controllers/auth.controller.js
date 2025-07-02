"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.loginUser = exports.registerUser = void 0;
const resFormat_1 = require("../utils/resFormat");
const generateToken_1 = require("../utils/generateToken");
const User_1 = require("../models/User");
const generateVerificationCode_1 = require("../utils/generateVerificationCode");
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const sendEmail_1 = require("../utils/sendEmail");
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone_number } = req.body;
        // Check for existing user
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json((0, resFormat_1.resFormat)(400, 'Email already exists', null, 0));
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create verification token
        const verificationToken = (0, generateVerificationCode_1.generateVerificationCode)();
        // Create new user
        const user = new User_1.User({
            name,
            email,
            password: hashedPassword,
            phone_number,
            profile_picture: '',
            verificationToken,
            verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        // Generate token
        const token = (0, generateToken_1.generateToken)(user._id);
        await user.save();
        // Remove sensitive fields before returning
        const { password: _, verificationToken: __, verificationTokenExpires: ___, resetPasswordToken: ____, resetPasswordExpires: _____, __v, ...safeUser } = user.toObject();
        return res
            .status(201)
            .cookie('token', token, {
            httpOnly: true, // Prevent access from JavaScript
            secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
            sameSite: 'strict', // Prevent CSRF (can also use 'lax' if you use links to access site)
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            path: '/', // Apply cookie to all routes
        })
            .json((0, resFormat_1.resFormat)(201, 'User registered successfully', safeUser, 1, token));
    }
    catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json((0, resFormat_1.resFormat)(500, 'Failed to register user', null, 0));
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json((0, resFormat_1.resFormat)(400, 'Invalid email or password', null, 0));
        }
        // Compare password
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json((0, resFormat_1.resFormat)(400, 'Invalid email or password', null, 0));
        }
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // Generate token
        const token = (0, generateToken_1.generateToken)(user._id);
        // Remove sensitive fields
        const { password: _, verificationToken: __, verificationTokenExpires: ___, resetPasswordToken: ____, resetPasswordExpires: _____, __v, ...safeUser } = user.toObject();
        return res
            .status(200)
            .cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
            .json((0, resFormat_1.resFormat)(200, 'User logged in successfully', safeUser, 1, token));
    }
    catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json((0, resFormat_1.resFormat)(500, 'Failed to login user', null, 0));
    }
};
exports.loginUser = loginUser;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json((0, resFormat_1.resFormat)(404, 'User not found', null, 0));
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${email}`;
        console.log(resetLink);
        const emailSent = await (0, sendEmail_1.sendResetEmail)(email, resetLink);
        if (!emailSent) {
            return res.status(500).json((0, resFormat_1.resFormat)(500, 'Failed to send reset email', null, 0));
        }
        return res
            .status(200)
            .json((0, resFormat_1.resFormat)(200, 'Reset email sent successfully', null, 1));
    }
    catch (err) {
        console.error('Forgot Password Error:', err);
        return res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
        return res
            .status(400)
            .json((0, resFormat_1.resFormat)(400, 'Missing fields', null, 0));
    }
    try {
        // Find user by email and token, and ensure token is not expired
        const user = await User_1.User.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }, // Token expiration check
        });
        if (!user) {
            return res
                .status(400)
                .json((0, resFormat_1.resFormat)(400, 'Invalid or expired token', null, 0));
        }
        // Hash the new password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Update the password and clear the reset fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res
            .status(200)
            .json((0, resFormat_1.resFormat)(200, 'Password updated successfully', null, 1));
    }
    catch (error) {
        console.error('Reset password error:', error);
        return res
            .status(500)
            .json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.resetPassword = resetPassword;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json((0, resFormat_1.resFormat)(401, "Unauthorized", null, 0));
        }
        const { name, phone_number, date_of_birth, gender } = req.body;
        let profile_picture = req.body.profile_picture;
        // If file is uploaded via multer + Cloudinary
        if (req.file) {
            const uploadedImage = req.file; // cloudinary-multer returns `path` (secure_url)
            profile_picture = uploadedImage.path; // Cloudinary secure URL
        }
        const updatedUser = await User_1.User.findByIdAndUpdate(userId, {
            $set: {
                ...(name && { name }),
                ...(phone_number && { phone_number }),
                ...(date_of_birth && { date_of_birth }),
                ...(gender && { gender }),
                ...(profile_picture && { profile_picture }),
            },
        }, { new: true }).select("-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires");
        if (!updatedUser) {
            return res.status(404).json((0, resFormat_1.resFormat)(404, "User not found", null, 0));
        }
        return res.json((0, resFormat_1.resFormat)(200, "Profile updated", { user: updatedUser }, 1));
    }
    catch (err) {
        console.error("Profile update error:", err);
        return res.status(500).json((0, resFormat_1.resFormat)(500, "Server error", null, 0));
    }
};
exports.updateProfile = updateProfile;
const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });
        return res.status(200).json((0, resFormat_1.resFormat)(200, "Logged out successfully", null, 1));
    }
    catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json((0, resFormat_1.resFormat)(500, "Server error during logout", null, 0));
    }
};
exports.logoutUser = logoutUser;
