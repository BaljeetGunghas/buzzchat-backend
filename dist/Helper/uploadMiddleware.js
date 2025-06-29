"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinaryConfig_1 = __importDefault(require("./cloudinaryConfig"));
const deleteExistingImages = async (userID) => {
    try {
        const result = await cloudinaryConfig_1.default.search
            .expression(`folder:buzzChat-uploads/profile/Id_${userID}`)
            .max_results(10) // Fetch up to 10 images in the folder
            .execute();
        if (result.resources.length > 0) {
            const deletePromises = result.resources.map((image) => cloudinaryConfig_1.default.uploader.destroy(image.public_id));
            await Promise.all(deletePromises);
        }
    }
    catch (error) {
        console.error("Cloudinary Deletion Error:", error);
    }
};
// Multer storage setup
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinaryConfig_1.default,
    params: async (req, file) => {
        const userID = req.user.id;
        await deleteExistingImages(userID);
        return {
            folder: `buzzChat-uploads/profile/Id_${userID}`, // Cloudinary folder
            public_id: `${Date.now()}_${file.originalname}`, // Unique file name
            format: "png", // Convert all uploads to PNG
            overwrite: true, // Ensures existing images are replaced
        };
    },
});
const upload = (0, multer_1.default)({ storage });
exports.default = upload;
