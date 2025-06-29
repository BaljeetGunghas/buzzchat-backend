"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const matchPassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt_1.default.compare(enteredPassword, hashedPassword);
};
exports.matchPassword = matchPassword;
