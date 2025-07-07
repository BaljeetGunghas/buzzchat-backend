import mongoose, { Document } from 'mongoose';

export interface IUser {
    name: string;
    email: string;
    password?: string | null;           // made optional
    phone_number: string;
    profile_picture: string;
    status: string;
    date_of_birth: Date;
    gender: string | null;
    isVerified?: boolean | null;
    lastLogin?: Date | null;
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
    verificationToken?: string | null;
    verificationTokenExpires?: Date | null;
    googleId?: string | null;            // new Google ID field
    loginProvider?: 'local' | 'google'; // to track login method
}

export interface IUserDocument extends IUser, Document {
    created_at: Date;
    updated_at: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, default: null },          // optional, default null
    phone_number: { type: String, default: null },
    profile_picture: { type: String, default: null },
    status: { type: String, enum: ['online', 'offline', 'banned'], default: 'online' },
    date_of_birth: { type: Date, default: null },
    gender: { type: String, default: null },

    // advanced
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },

    // Google OAuth fields
    googleId: { type: String, unique: true, sparse: true, default: null },
    loginProvider: { type: String, enum: ['local', 'google'], default: 'local' },
}, { timestamps: true });

export const User = mongoose.model<IUserDocument>('User', userSchema);
