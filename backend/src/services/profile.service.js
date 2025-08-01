import { findUserByEmail } from "../repositories/index.repository.js";

export default async function userProfileService(req, res){
    try{

        const userEmail = req.user.email; 
        if (!userEmail) {
            return res.status(404).json({ error: "User email not found in request" });
        }
        
        const user = await findUserByEmail(userEmail);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const userProfile = {
            id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio || "Hey there! I am using ChatApp.",
            profilePicture: user.profilePicture || null,
        };

        return {status: 200, data: userProfile, message: "profile data fetched successfully"};
    } catch(error){
        console.error("Error in userProfileService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}