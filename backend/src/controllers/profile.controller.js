import userProfileService from "../services/profile.service.js";

export default async function userProfileController(req, res) {
    try {
        const response = await userProfileService(req);
        if(!response.data){
            return res.status(response.status || 400).json({error: response.error || "Something went wrong"})
        }

        return res.status(200).json({ 
            data: response.data,
            message: response.message
        });
        
    } catch (error) {
        console.error("Error in userProfileController:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}