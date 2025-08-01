import { findUserByEmail, getChatHistory } from "../repositories/index.repository.js";

export default async function chatHistoryService(req, res){
    try{
        const friendId = req.body.friendId;
        const userEmail = req.user.email;

        if (!friendId) {
            return { status: 400, error: "Friend ID is required" };
        }

        const user = await findUserByEmail(userEmail);
        if (!user) {
            return { status: 404, error: "User not found" };
        }
        const userId = user._id;
        
        const chatHistory = await getChatHistory(friendId, userId);
        if(chatHistory.length === 0){
            return {status: 200, data: [], message: "No chat history"}
        }
        return {status: 200, data: chatHistory, message: "chat history retrieved Successfully"}
    } catch(error){
        console.error("Error in chatHistoryService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}