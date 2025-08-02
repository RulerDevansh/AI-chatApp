import { findUserByEmail, findMessageById, deleteMessageById } from '../repositories/index.repository.js';
import deleteUserChatFileFromCloudinary, { isCloudinaryUrl, extractCloudinaryUrl } from '../cloudinary/deleteUserChatFiles.js';

export default async function deleteMessageService(req, res) {
    try {
        console.log('deleteMessageService called with body:', req.body);
        
        const messageId = req.body.messageId;
        console.log('Extracted messageId:', messageId);

        if (!messageId) {
            console.log('No messageId provided');
            return { status: 400, error: "Message ID is required" };
        }
        
        const userEmail = req.user.email;
        console.log('User email:', userEmail);
        
        const user = await findUserByEmail(userEmail);
        
        if (!user) {
            console.log('User not found');
            return { status: 404, error: "User not found" };
        }

        console.log('Looking for message with ID:', messageId);
        const message = await findMessageById(messageId);
        
        if (!message) {
            console.log('Message not found');
            return { status: 404, error: "Message not found" };
        }

        console.log('Message found:', message);
        console.log('Message sender:', message.sender);
        console.log('Message receiver:', message.receiver);
        console.log('Current user ID:', user._id);

        // Allow deletion if user is either sender OR receiver
        const isSender = message.sender.toString() === user._id.toString();
        const isReceiver = message.receiver.toString() === user._id.toString();
        
        if (!isSender && !isReceiver) {
            console.log('User not authorized to delete this message');
            return { status: 403, error: "You can only delete messages you sent or received" };
        }

        // Check if message contains a file and attempt to delete from Cloudinary
        let cloudinaryDeletionSuccess = true;
        if (message.content && isCloudinaryUrl(message.content)) {
            console.log('Message contains Cloudinary file, attempting to delete from cloud storage');
            const cloudinaryUrl = extractCloudinaryUrl(message.content);
            
            if (cloudinaryUrl) {
                cloudinaryDeletionSuccess = await deleteUserChatFileFromCloudinary(cloudinaryUrl);
                
                if (!cloudinaryDeletionSuccess) {
                    console.warn('Failed to delete file from Cloudinary, but continuing with message deletion');
                    // Note: We continue with message deletion even if Cloudinary deletion fails
                    // to avoid orphaned database records
                }
            }
        }

        const deletedMessage = await deleteMessageById(messageId);
        
        if (!deletedMessage) {
            console.log('Failed to delete message');
            return { status: 400, error: "Failed to delete message" };
        }
        
        console.log("Message deleted successfully:", deletedMessage);
        
        // Include Cloudinary deletion status in response
        const response = { 
            message: "Message deleted successfully",
            cloudinaryDeletion: cloudinaryDeletionSuccess 
        };
        
        if (!cloudinaryDeletionSuccess) {
            response.warning = "Message deleted but associated file may still exist in cloud storage";
        }
        
        return { status: 200, data: response };
        
    } catch (error) {
        console.error("Error in deleteMessageService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}