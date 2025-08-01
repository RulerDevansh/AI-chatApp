import markMsgSeenService from "../services/markMsgSeen.service.js";

export default async function markMsgAsSeenController(req, res){
    try{
        const response = await markMsgSeenService(req);
        if(response.status===500 || response.error){
            return res.status(response.status || 500).json({error: response.error || "something went wrong while setting msg as seen"})
        }
        return res.status(response.status || 200).json({message: response.message || "message marked as seen successfully"});
    } catch(error){
        console.error("Error in markSeenController: ", error);
        res.status(500).json({error: "Internal Server Error!"})
    }
}