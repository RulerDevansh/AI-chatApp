import { getUnreadMessageCounts } from "../repositories/index.repository.js";

export default async function unreadMessagesService(req, res) {
    try {
        const userId = req.user.id;
        
        if (!userId) {
            return { status: 400, error: "User ID is required" };
        }

        const unreadCounts = await getUnreadMessageCounts(userId);
        
        return {
            status: 200, 
            data: unreadCounts, 
            message: "Unread message counts retrieved successfully"
        };
    } catch (error) {
        console.error("Error in unreadMessagesService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}
