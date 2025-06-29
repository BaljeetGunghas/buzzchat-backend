"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resFormat = void 0;
const resFormat = (status, message, jsonResponse = null, output = 1, token) => ({
    status,
    message,
    jsonResponse,
    output,
    ...(token && { token }),
});
exports.resFormat = resFormat;
