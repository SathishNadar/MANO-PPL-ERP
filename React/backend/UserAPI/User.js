
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { knexDB } from '../Database.js';
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import { uploadFile } from '../S3/S3Service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const router = express.Router();
const upload = multer(); // Memory storage

router.put('/update', authenticateJWT, upload.single('profile_image'), catchAsync(async (req, res) => {
    const userId = req.user.user_id;
    const { user_name, email, phone_no } = req.body;
    let updateData = {};

    // Validate user exists
    const user = await knexDB('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Handle Profile Image Upload
    if (req.file) {
        const fileBuffer = await sharp(req.file.buffer)
            .resize(1000, 1000, { fit: 'cover' }) // Force 1000x1000, cropping if necessary
            .webp({ quality: 80 }) // Compress to WebP
            .toBuffer();

        const timestamp = Date.now();
        const key = `users/${userId}_${timestamp}.webp`;

        try {
            await uploadFile({
                fileBuffer,
                key, // S3Service handles directory if passed, or we can pass full key
                directory: '', // We already included 'users/' in the key
                contentType: 'image/webp'
            });

            updateData.profile_image_key = key;
        } catch (error) {
            console.error("Image upload failed:", error);
            throw new AppError('Failed to upload image', 500);
        }
    }

    // Handle text fields
    if (user_name) updateData.user_name = user_name;
    if (email) updateData.email = email;
    if (phone_no) updateData.phone_no = phone_no;
    if (designation) updateData.designation = designation;

    if (Object.keys(updateData).length > 0) {
        await knexDB('users').where({ user_id: userId }).update(updateData);
    }

    // Fetch updated user to return
    const updatedUser = await knexDB('users').where({ user_id: userId }).first();

    res.json({
        status: 'success',
        message: 'User updated successfully',
        user: {
            user_id: updatedUser.user_id,
            user_name: updatedUser.user_name,
            email: updatedUser.email,
            phone_no: updatedUser.phone_no,
            designation: updatedUser.designation,
            profile_image_key: updatedUser.profile_image_key
        }
    });
}));

export default router;
