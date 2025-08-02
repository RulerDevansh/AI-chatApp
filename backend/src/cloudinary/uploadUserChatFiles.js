import { cloudinary } from "../cloudinary/config.js";
import fs from "fs";

export default async function uploadUserChatFilesToCloudinary(file) {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'Chat-Files',
      resource_type: file.mimetype.startsWith('video') ? 'video' : 'auto',
    });

    fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting local file:', err);
    }); 
    
    return result.secure_url;
  } catch (err) {
    console.error("Error uploading chat file:", err);
    return null;
  }
}