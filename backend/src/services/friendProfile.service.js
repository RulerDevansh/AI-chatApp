import { findUserByUsername } from "../repositories/index.repository.js";

export default async function friendProfileService(req, res) {
    try {
        console.log("Fetching friend profile for user:", req.body, req.query);
        const username = req.body.username;
        
        if (!username) {
            return { status: 400, error: "Username is required" };
        }
        
        const user = await findUserByUsername(username);
        if(!user){
            return { status: 404, error: "User not found" };
        }
        
        const userObj = {
            username: user.username,
            userId: user._id,
            bio: user.bio || "Hey there! I am using .",
            profilePicture: user.profilePicture || null
        };

        return { status: 200, data: userObj };
    } catch (error) {
        console.error("Error in friendProfileService:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}