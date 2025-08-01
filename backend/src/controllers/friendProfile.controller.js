import friendProfileService from "../services/friendProfile.service.js";

export default async function friendProfiileController(req, res) {
    try{
        const response = await friendProfileService(req, res);
        if(!response.data || !response.status){
            return res.status(response.status || 500).json({ error: response.error || "Internal Server Error" });
        }
        return res.status(response.status).json(response.data);
    } catch(error){
        console.error("Error in friendProfiileController:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}