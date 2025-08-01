import acceptInvitationService from "../services/acceptInvitation.service.js";

export default async function acceptInvitationController(req, res){
    try{
        const response = await acceptInvitationService(req, res);
        if(response.status==404 || response.status==500 || response.status==500 || !response.data){
            return res.status(response.status || 500).json({ message: response.error || "Internal Server Error" });
        }
        res.status(response.status).json({
            message: response.data.message || "Invitation accepted successfully",
            connectionStatus: response.data.status || "accepted",
        });
    } catch(error){
        console.error("Error in acceptInvitationController:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
} 