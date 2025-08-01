import sendMessageService from "../services/sendMessage.service.js";

export default async function sendMessageController(req, res){
    try{
        const response = await sendMessageService(req, res);
        if(!response.data || response.status===400){
            return res.status(response.status || 400).json({message: response.message || "Some error in sending message"})
        }
        res.status(response.status).json({data: response.data, message: response.message});
    } catch(error){
        console.error("Error in sendMessageController", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}