// src/controllers/userController.ts

import { Request, Response } from 'express';
import { User } from '../models/User';
import { resFormat } from '../utils/resFormat';

// Get all users (excluding password and sensitive fields)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');
    res.status(200).json(resFormat(200, 'Users fetched successfully', users));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};

// Get a specific user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');
    if (!user) return res.status(404).json(resFormat(404, 'User not found', null, 0));
    res.status(200).json(resFormat(200, 'User fetched successfully', user));
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};

// Get online users (you'll need to track this with socket.io and DB or in-memory store)
export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    const onlineUsers = await User.find({ status: 'online' }).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires -createdAt -updatedAt');
    res.status(200).json(resFormat(200, 'Online users fetched successfully', onlineUsers));
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};
