import { sendMessage } from "../repositories/index.repository.js";
import uploadUserChatFilesToCloudinary from "../cloudinary/uploadUserChatFiles.js";

export default async function sendMessageService(req, res){
    try{
        const friendId = req.body.friendId;
        const userId = req.user.id;
        if(!req.body.content && !req.file){
            return { status: 400, error: "message cannot be empty"};
        }
        else if(req.file && req.body.content){
            const content = req.body.content;
            const fileURL = await uploadUserChatFilesToCloudinary(req.file);
            const message1 = await sendMessage(friendId, userId, fileURL);
            const message2 = await sendMessage(friendId, userId, content);
            if(message1 && message2){
                return { status: 200, message: "message sent successfully"}
            }
            else if(!message1 && !message2){
                return { status: 500, error: "Error in sending both files and message"};
            }
            else if(!message1){
                return { status: 500, error: "Something went wrong while sending file"}
            }
            else{
                return {status: 500, error: "Something went wrong while sending message"}
            }
        }
        else if(req.file){
            const fileURL = await uploadUserChatFilesToCloudinary(req.file);
            const message = await sendMessage(friendId, userId, fileURL);
            if(!message){
                return { status: 500, error: "something went wrong while sending file"};
            }
            return { status: 200, message: "file sent successfully"};
        }
        else{
            const content = req.body.content;
            const message = await sendMessage(friendId, userId, content);
            if(!message){
                return { status: 500, error: "Something went wrong while sending message"};
            }
            return { status: 200, message: "message sent successfully", data: message}
        }
    } catch(error){
        console.error("Error in sendMessageService: ", error);
        res.status(500).json({error: "Internal Server Error"})
    }
}