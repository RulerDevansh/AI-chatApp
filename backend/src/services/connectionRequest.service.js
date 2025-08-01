import { findUserByEmail, findUserByUsername, findConnectionById } from "../repositories/index.repository.js";
import { sendConnectionRequest } from "../repositories/index.repository.js";

export default async function connectionRequestService(req, res){
    try{
        const friendName = req.body.username;
        if (!friendName) {
            return { status: 400, error: "Friend name is required" };
        }
        const userEmail = req.user.email;
        const friend = await findUserByUsername(friendName);
        if (!friend) {
            return { status: 404, error: "Friend not found" };
        }
        const user = await findUserByEmail(userEmail);
        const userId = user._id;
        const friendId = friend._id;
        const existingConnection = await findConnectionById(userId, friendId);
        if (existingConnection) {
            return { status: 400, error: "Connection request already exists" };
        }
        const connection = await sendConnectionRequest(userId, friendId);

        if (!connection) {
            return { status: 400, error: "Connection request failed" };
        }
        return { status: 200, data: { message: "Connection request sent successfully", status: connection.status } };
    } catch(error){
        console.error("Error in connectionRequestService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}