"use strict";
// src/controllers/userController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.getUserById = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
const resFormat_1 = require("../utils/resFormat");
// Get all users (excluding password and sensitive fields)
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.User.find().select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');
        res.status(200).json((0, resFormat_1.resFormat)(200, 'Users fetched successfully', users));
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.getAllUsers = getAllUsers;
// Get a specific user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');
        if (!user)
            return res.status(404).json((0, resFormat_1.resFormat)(404, 'User not found', null, 0));
        res.status(200).json((0, resFormat_1.resFormat)(200, 'User fetched successfully', user));
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.getUserById = getUserById;
const getOnlineUsers = async (req, res) => {
    try {
        let { userIds } = req.body;
        // Exclude logged-in user's ID from the list
        const loggedInUserId = req.user?.id;
        userIds = userIds.filter((id) => id !== loggedInUserId);
        const onlineUsers = await User_1.User.find({ _id: { $in: userIds } })
            .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires -createdAt -updatedAt');
        res.status(200).json((0, resFormat_1.resFormat)(200, 'Online users fetched successfully', onlineUsers));
    }
    catch (error) {
        console.error('Error fetching online users:', error);
        res.status(500).json((0, resFormat_1.resFormat)(500, 'Server error', null, 0));
    }
};
exports.getOnlineUsers = getOnlineUsers;
