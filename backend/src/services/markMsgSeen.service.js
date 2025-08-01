import { findUserByEmail, markMsgSeenRepo } from "../repositories/index.repository.js";

export default async function markMsgSeenService(req){
    try{
        const useremail = req.user.email;
        if(!useremail){
            return { status: 500, error: "useremail not found, please login first"}
        }
        const user = await findUserByEmail(useremail);
        if(!user){
            return { status: 500, error: "user with the provided email doesnot exists!"}
        }
        const receiverId = user._id;
        const senderId = req.body.senderId;
        const response = await markMsgSeenRepo(receiverId, senderId);
        if(!response){
            return { status: 500, error: "something went wrong while setting msg as seen"}
        }
        return {status: 200, message: "message marked as seen successfully!"}
    } catch(error){
        console.error("Error in markMsgSeenService: ", error);
        return {status: 500, error: "Internal Server Error!!"}
    }
}