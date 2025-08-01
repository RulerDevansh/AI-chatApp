import chatHistoryService from "../services/chatHistory.service.js";

export default async function chatHistoryController(req, res) {
    try{
        const response = await chatHistoryService(req, res);
        if(response.status===200 && response.data.length===0){
            return res.status(response.status||200).json({message: response.message});
        }
        res.status(response.status).json({data: response.data, message: response.message});
    } catch(error){
        console.error("Error in chatHistoryController:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}