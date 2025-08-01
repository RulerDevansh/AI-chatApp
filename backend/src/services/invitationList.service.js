import { findUserByEmail, findUserByUserId } from "../repositories/index.repository.js";
import { findInvitationSentByUser, findInvitationReceivedByUser } from "../repositories/index.repository.js";

export async function invitationSentService(req, res) {
    try {
        const userEmail = req.user.email;
        const user = await findUserByEmail(userEmail);
        if (!user) {
            return { status: 404, error: "User not found" };
        }
        const userId = user._id;
        const invitationsSent = await findInvitationSentByUser(userId);
        
        if (invitationsSent.length === 0) { 
            return { status: 200, data: [], message: "No invitation request sent by you" };
        }

        // Resolve receiver IDs to usernames
        const processedInvitations = await Promise.all(
            invitationsSent.map(async (invitation) => {
                try {
                    const receiverUser = await findUserByUserId(invitation.receiver);
                    return {
                        ...invitation,
                        receiverUsername: receiverUser ? receiverUser.username : 'Unknown User'
                    };
                } catch (error) {
                    console.error('Error resolving receiver username:', error);
                    return {
                        ...invitation,
                        receiverUsername: 'Unknown User'
                    };
                }
            })
        );

        return { status: 200, data: processedInvitations };

    } catch (error) {
        console.error("Error in invitationSentService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}

export async function invitationReceivedService(req, res) {
    try{
        const userEmail = req.user.email;
        const user = await findUserByEmail(userEmail);
        const userId = user._id;
        const invitationsReceived = await findInvitationReceivedByUser(userId);

        if (invitationsReceived.length === 0) {
            return { status: 200, data: [], message: "No invitation request received" };
        }

        // Resolve sender IDs to usernames
        const processedInvitations = await Promise.all(
            invitationsReceived.map(async (invitation) => {
                try {
                    const senderUser = await findUserByUserId(invitation.sender);
                    return {
                        ...invitation,
                        senderUsername: senderUser ? senderUser.username : 'Unknown User'
                    };
                } catch (error) {
                    console.error('Error resolving sender username:', error);
                    return {
                        ...invitation,
                        senderUsername: 'Unknown User'
                    };
                }
            })
        );

        return { status: 200, data: processedInvitations };
    } catch(error){
        console.error("Error in invitationReceivedService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}