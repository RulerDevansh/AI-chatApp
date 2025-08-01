import { invitationReceivedService, invitationSentService } from "../services/invitationList.service.js";


export async function invitationSentController(req, res){
    try{
        const response = await invitationSentService(req, res);
        if(response.data.length === 0 && response.status === 200) {
            return res.status(response.status).json({ message: response.message || "No invitation request sent by you" });
        }
        res.status(response.status).json({ data: response.data });
    } catch(error){
        console.error("Error in invitationSentController:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function invitationReceivedController(req, res){
    try{
        const response = await invitationReceivedService(req, res);
        if(response.data.length === 0 && response.status === 200) {
            return res.status(response.status).json({ message: response.message || "No invitation request received" });
        }
        res.status(response.status).json({ data: response.data });
    } catch(error){
        console.error("Error in invitationReceivedController:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}