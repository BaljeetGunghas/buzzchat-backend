import { Request, Response } from 'express';
import { resFormat } from '../utils/resFormat';
import { generateToken } from '../utils/generateToken';
import { IUser, User } from '../models/User';
import { generateVerificationCode } from '../utils/generateVerificationCode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendResetEmail } from '../utils/sendEmail';
import path from "path";
import fs from "fs";



interface AuthRequest extends Request {
  user?: { id: string };
}


export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone_number } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(resFormat(400, 'Email already exists', null, 0));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create verification token
    const verificationToken = generateVerificationCode();

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone_number,
      profile_picture: '',
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Generate token
    const token = generateToken(user._id as string);

    await user.save();

    // Remove sensitive fields before returning
    const {
      password: _,
      verificationToken: __,
      verificationTokenExpires: ___,
      resetPasswordToken: ____,
      resetPasswordExpires: _____,
      __v,
      ...safeUser
    } = user.toObject();

    return res
      .status(201)
      .cookie('token', token, {
        httpOnly: true,                        // Prevent access from JavaScript
        secure: process.env.NODE_ENV === 'production',  // Send only over HTTPS in production
        sameSite: 'strict',                    // Prevent CSRF (can also use 'lax' if you use links to access site)
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        path: '/',                             // Apply cookie to all routes
      })
      .json(resFormat(201, 'User registered successfully', safeUser, 1, token));
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json(resFormat(500, 'Failed to register user', null, 0));
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json(resFormat(400, 'Invalid email or password', null, 0));
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json(resFormat(400, 'Invalid email or password', null, 0));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id as string);

    // Remove sensitive fields
    const {
      password: _,
      verificationToken: __,
      verificationTokenExpires: ___,
      resetPasswordToken: ____,
      resetPasswordExpires: _____,
      __v,
      ...safeUser
    } = user.toObject();

    return res
      .status(200)
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .json(resFormat(200, 'User logged in successfully', safeUser, 1, token));
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json(resFormat(500, 'Failed to login user', null, 0));
  }
};


export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(resFormat(404, 'User not found', null, 0));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    const resetLink = `https://your-frontend.com/reset-password?token=${resetToken}&email=${email}`;

    const emailSent = await sendResetEmail(email, resetLink);
    if (!emailSent) {
      return res.status(500).json(resFormat(500, 'Failed to send reset email', null, 0));
    }

    return res
      .status(200)
      .json(resFormat(200, 'Reset email sent successfully', null, 1));
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json(resFormat(500, 'Server error', null, 0));
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(resFormat(401, "Unauthorized", null, 0));
    }

    const { name, phone_number, date_of_birth } = req.body;
    let profile_picture = req.body.profile_picture;

    // If file is uploaded via multer, override the profile_picture
    if (req.file) {
      profile_picture = `/uploads/profile-pictures/${req.file.filename}`;

      // Optionally remove old profile picture
      const user = await User.findById(userId);
      if (user?.profile_picture) {
        const oldPath = path.join(__dirname, "../../uploads/profile-pictures", path.basename(user.profile_picture));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(name && { name }),
          ...(phone_number && { phone_number }),
          ...(profile_picture && { profile_picture }),
          ...(date_of_birth && { date_of_birth }),
        },
      },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires");

    if (!updatedUser) {
      return res.status(404).json(resFormat(404, "User not found", null, 0));
    }

    return res.json(resFormat(200, "Profile updated", { user: updatedUser }, 1));
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json(resFormat(500, "Server error", null, 0));
  }
};



export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json(
      resFormat(200, "Logged out successfully", null, 1)
    );
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json(
      resFormat(500, "Server error during logout", null, 0)
    );
  }
};