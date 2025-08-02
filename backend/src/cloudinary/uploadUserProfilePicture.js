import fs from 'fs/promises';
import { cloudinary } from "./config.js";

export default async function uploadUserProfilePictureOnCloudinary(req, userId) {
    try {
        console.log("Hello from uploadOnCloudinary: ", req.file.path);

        // Step 1: Upload with temp public ID
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'Profile-Pictures',
            resource_type: 'auto',
            public_id: `temp_user_${userId}_avatar_${Date.now()}`,
            tags: ['Profile-Picture'],
            overwrite: true,
            use_filename: false,
            unique_filename: false,
        });

        const tempPublicId = uploadResult.public_id;

        // Step 2: Delete old image (if it exists)
        await cloudinary.uploader.destroy(`Profile-Pictures/user_${userId}_avatar`);

        // Step 3: Rename temp image to final name
        const finalPublicId = `Profile-Pictures/user_${userId}_avatar`;
        const renameResult = await cloudinary.uploader.rename(tempPublicId, finalPublicId);

        // Step 4: Delete local file
        await fs.unlink(req.file.path);

        // Step 5: Return final image URL
        return renameResult.secure_url;
    } catch (error) {
        console.log("Error in uploadOnCloudinary: ", error);
        return { status: 500, error: "Something went wrong in uploadOnCloudinary function" };
    }
}
