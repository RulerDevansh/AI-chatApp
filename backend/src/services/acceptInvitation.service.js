import { findConnectionById, findUserByEmail, findUserByUsername } from "../repositories/index.repository.js";

export default async function acceptInvitationService(req, res) {
    try{
        const userEmail = req.user.email;
        const friendName = req.body.username;
        const user = await findUserByEmail(userEmail);
        const friend = await findUserByUsername(friendName);
        
        if (!user) {
            return { status: 404, error: "User not found" };
        }
        if (!friend) {
            return { status: 404, error: "Friend not found" };
        }
        
        const userId = user._id;
        const friendId = friend._id;
        
        const connection = await findConnectionById(userId, friendId);
        if (!connection) {
            return { status: 404, error: "Connection not found" };
        }
        if (connection.status === "accepted") {
            return { status: 400, error: "Connection already accepted" };
        }
        if (connection.status === "withdrawn") {
            return { status: 400, error: "Connection request withdrawn" };
        }
        connection.status = "accepted";
        await connection.save();
        return { status: 200, data: { message: "Connection request accepted successfully", connectionStatus: connection.status } };
    } catch(error){
        console.error("Error in acceptInvitationService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}