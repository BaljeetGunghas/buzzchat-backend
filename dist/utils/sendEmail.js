"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetEmail = void 0;
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // loads from .env in project root
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendResetEmail = async (email, link) => {
    try {
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'jaatmrharyanvi@gmail.com',
            subject: 'BuzzChat - Reset Your Password',
            html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.6; background: #fff9eb; padding: 30px; color: #333;">
                <div style="max-width: 600px; margin: auto; border: 1px solid #f6e58d; border-radius: 8px; box-shadow: 0 4px 12px rgba(230, 210, 120, 0.3); background: white; padding: 30px;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <img 
                        src="https://sdmntprwestus2.oaiusercontent.com/files/00000000-f5d8-61f8-ab75-10fdc348cc16/raw?se=2025-06-25T07%3A15%3A28Z&sp=r&sv=2024-08-04&sr=b&scid=7a06956b-130c-5840-ba40-81878acf13a2&skoid=e9d2f8b1-028a-4cff-8eb1-d0e66fbefcca&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-24T11%3A18%3A55Z&ske=2025-06-25T11%3A18%3A55Z&sks=b&skv=2024-08-04&sig=xW7v8hXzl3Rxfhp9S6%2Btm3QcZYlqupPVeL8//ns1fLg%3D"
                        alt="BuzzChat Logo"
                        width="120" 
                        style="display: inline-block;border-radius: 20px" 
                    />
                </div>

                <h2 style="color: #f1c40f; font-weight: 700; font-size: 1.8rem; margin-bottom: 20px;text-align:center">
                    Password Reset Request
                </h2>

                <p style="font-size: 1rem; margin-bottom: 16px;">Hello,</p>

                <p style="font-size: 1rem; margin-bottom: 24px;">
                    You recently requested to reset your password. Click the button below to continue:
                </p>

                <p style="text-align: center; margin-bottom: 32px;">
                    <a href="${link}" target="_blank" 
                    style="
                        background-color: #f1c40f; 
                        color: #222; 
                        padding: 12px 28px; 
                        border-radius: 6px; 
                        font-weight: 600; 
                        text-decoration: none;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(241, 196, 15, 0.5);
                    ">
                    Reset Password
                    </a>
                </p>

                <p style="font-size: 0.9rem; color: #555; margin-bottom: 16px;">
                    If you didn’t request this, you can safely ignore this email.
                </p>

                <p style="font-size: 0.9rem; color: #555; margin-bottom: 0; text-align:center;">
                    — The BuzzChat Team —
                </p>
                </div>
            </div>
            `,
        });
        console.log('Resend email response:', response);
        return true;
    }
    catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
};
exports.sendResetEmail = sendResetEmail;
