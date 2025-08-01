import { rejectInvitationRepository, findUserByEmail, findConnectionById } from "../repositories/index.repository.js";

export default async function rejectInvitationService(req, res){
    try{    
        const userEmail = req.user.email;
        const friendId = req.body.friendId;

        if (!friendId) {
            return { status: 400, error: "Friend ID is required" };
        }

        const user = await findUserByEmail(userEmail);
        if (!user) {
            return { status: 404, error: "User not found" };
        }

        const userId = user._id;
        const connection = await findConnectionById(userId, friendId);
        
        if (!connection) {
            return { status: 404, error: "Connection not found" };
        }
        
        if (connection.status !== 'pending') {
            return { status: 400, error: "Connection request is not pending" };
        }
        const response = await rejectInvitationRepository(connection._id);
        if (!response) {
            return { status: 400, error: "Failed to reject invitation" };
        }
        console.log("Invitation rejected successfully for connection ID:", connection._id);

        return { status: 200, data: { message: "Invitation rejected successfully" } };
    } catch(error){
        console.error("Error in rejectInvitationService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}