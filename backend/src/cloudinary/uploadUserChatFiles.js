import { cloudinary } from "../cloudinary/config.js";
import fs from "fs/promises";

export default async function uploadUserChatFilesToCloudinary(file) {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'Chat-Files',
      resource_type: file.mimetype.startsWith('video') ? 'video' : 'auto',
    });

    await fs.unlink(file.path);
    
    return result.secure_url;
  } catch (err) {
    console.error("Error uploading chat file:", err);
    return null;
  }
}