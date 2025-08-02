import { findUserByEmail, findMessageById, deleteMessageById } from '../repositories/index.repository.js';

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

        const deletedMessage = await deleteMessageById(messageId);
        
        if (!deletedMessage) {
            console.log('Failed to delete message');
            return { status: 400, error: "Failed to delete message" };
        }
        
        console.log("Message deleted successfully:", deletedMessage);
        return { status: 200, data: { message: "Message deleted successfully" } };
        
    } catch (error) {
        console.error("Error in deleteMessageService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}