import User from '../models/user.model.js';
import Connection from '../models/connection.model.js';
import Message from '../models/message.model.js';
import mongoose from 'mongoose';

export async function registerUser(userDetails) {
    try {
        const newUser = new User(userDetails);
        const savedUser = await newUser.save();
        const userObj = savedUser.toObject();

        // Remove the password field
        delete userObj.password;
        return userObj;
    } catch (error) {
        console.error("Error in registerUser:", error);
        throw new Error("Internal Server Error");
    }
}

export async function findUserByEmail(email) {
    try {
        const user = await User.findOne({ email });
        return user;
    } catch (error) {
        console.error("Error in findUserByEmail:", error);
    }
}

export async function findUserByUsername(username) {
    try {
        const user = await User.findOne({ username});
        if(user){
            const userObj = user.toObject();

            // Remove the password field
            delete userObj.password;
            return userObj;
        } 
        return user;
    } catch (error) {
        console.error("Error in findUserByUsername:", error);
    }   
}

export async function sendConnectionRequest(userId, friendId) {
    try {
        const obj = {
            sender: userId,
            receiver: friendId,
        }
        console.log("Sending connection request from userId:", userId, "to friendId:", friendId);
        const connection = new Connection(obj);
        const savedConnection = await connection.save();
        return savedConnection;
    } catch (error) {
        console.error("Error in sendConnectionRequest:", error);
        throw new Error("Internal Server Error");
    }
}


export async function findInvitationSentByUser(userId){
    try{
        const connections = await Connection.find({ sender: userId });
        if (connections.length === 0) {
            return [];
        }
        const connectionList = connections
        .filter(connection => connection.status === 'pending')
        .map(connection => ({
            _id: connection._id,
            receiver: connection.receiver,
        }));
        return connectionList;
    } catch(error){
        console.error("Error in findRequestSentByUser:", error);
        throw new Error("Internal Server Error");
    }
}

export async function findInvitationReceivedByUser(userId){
    try{
        const connections = await Connection.find({ receiver: userId });
        if (connections.length === 0) {
            return [];
        }
        const connectionList = connections
        .filter(connection => connection.status === 'pending')
        .map(connection => ({
            _id: connection._id,
            sender: connection.sender,
        }));
        return connectionList;
    } catch(error){
        console.error("Error in findInvitationReceivedByUser:", error);
        throw new Error("Internal Server Error");
    }
}

export async function findConnectionById(userId, friendId){
    try{
        const connection = await Connection.findOne({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        });
        if (!connection) {
            return null;
        }
        return connection;
    } catch(error){
        console.error("Error in findConnectionById:", error);
        throw new Error("Internal Server Error");
    }
} 

export async function getChatHistory(friendId, userId){
    try{
        const chatHistory = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        })

        if(chatHistory.length ===0 ){
            return [];
        }
        return chatHistory;
    } catch(error){
        console.error("Error in getChatHistory Repo: ", error);
        throw new Error("internal Server Error");
    }
}


export async function sendMessage(friendId, userId, content){
    try{    
        const message = new Message({sender: userId, receiver: friendId, content});
        const savedMessage = await message.save();
        return savedMessage;
    } catch(error){
        console.error("Error in sendMessageRepo: ", error);
        throw new Error("Internal Server Error");
    }
}

export async function getConnectionList(userId){
    try{
        const connections = await  Connection.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });
        const connectionList = connections.filter(connection => connection.status==='accepted').map(connection => {
            const isSender = connection.sender.toString() === userId.toString();
            return {
                _id: connection._id,
                friendId: isSender ? connection.receiver : connection.sender,
            };
        });
        if (connectionList.length === 0) {
            return [];
        }
        return connectionList;
    } catch(error){
        console.error("Error in getConnectionList:", error);
        throw new Error("Internal Server Error");
    }
}

export async function findUserByUserId(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return null;
        }
        const userObj = user.toObject();

        // Remove the password field
        delete userObj.password;
        return userObj;
    } catch (error) {
        console.error("Error in findUserByUserId:", error);
        throw new Error("Internal Server Error");
    }
}

export async function findConnectionByIdAndDeleteConnection(connectionId) {
    try{    
        const connection = await Connection.findByIdAndDelete(connectionId);
        if (!connection) {
            return null;
        }
        return connection;
    } catch(error){
        console.error("Error in findConnectionByIdAndDeleteConnection:", error);
        throw new Error("Internal Server Error");
    }
}

export async function rejectInvitationRepository(connectionId) {
    try {
        const connection = await Connection.findByIdAndDelete(connectionId);
        if (!connection) {
            return null;
        }
        return connection;
    } catch (error) {
        console.error("Error in rejectInvitationRepository:", error);
        throw new Error("Internal Server Error");
    }
}

export async function findMessageById(messageId) {
    try {
        const message = await Message.findById(messageId);
        if (!message) {     
            return null;
        }   
        return message;
    } catch (error) {
        console.error("Error in findMessageById:", error);
        throw new Error("Internal Server Error");
    }
}

export async function deleteMessageById(messageId){
    try{
        const message = await Message.findByIdAndDelete(messageId);
        if(!message){
            return null;
        }
        return message;
    } catch(error){
        console.error("Error in deleteMessageById Repository: ",error);
        throw new Error("Internal Server Error");
    }
}

export async function updateBioRepo(userId, bio){
    try{
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { bio: bio } }, {new: true});
        if(!updatedUser){
            return null;
        }
        return updatedUser;
    } catch(error){
        console.error("Error in updateBio Repository: ", error);
        throw new Error("Internal server Error");
    }
}

export async function markMsgSeenRepo(receiverId, senderId){
    try{
        const response = await Message.updateMany(
            {sender: senderId, receiver: receiverId, isSeen: false,},
            {
                $set: {
                    isSeen: true,
                }
            }
        );
        if(!response) return null;
        return response;
    } catch(error){
        console.error("Error in markMsgSeenRepo: ", error);
        throw new Error("Internal Server Error!");
    }
}

export async function updateProfilePictureRepo(userId, pictureURL){
    try{
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { profilePicture: pictureURL } }, {new: true});
        if(!updatedUser){
            return {status: 500, error: "Internal Server Error"}
        }
        return updatedUser;
    } catch(error){
        console.log("Error in updateProfilePictureRepo: ", error);
        return { status: 400, error: "Something went wrong"};
    }
}

export async function updateUserPasswordRepo(user, password){
    try{
        user.password = password;
        const savedUser = await user.save();
        return savedUser;
    } catch(error){
        console.log("Error in updateUserPassewordRepo: ", error);
        return { status: 500, error: "Internal Server Error"};
    }
}

export async function getUnreadMessageCounts(userId) {
    try {
        // Convert userId to ObjectId if it's a string
        const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        
        // Get all unique conversation partners (senders who sent messages to this user)
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiver: userObjectId,
                    isSeen: false
                }
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "senderInfo"
                }
            },
            {
                $project: {
                    senderId: "$_id",
                    count: 1,
                    senderInfo: { $arrayElemAt: ["$senderInfo", 0] }
                }
            }
        ]);

        // Format the response to include sender details
        const formattedCounts = unreadCounts.map(item => ({
            senderId: item.senderId.toString(),
            count: item.count,
            senderName: item.senderInfo?.username || "Unknown User",
            senderEmail: item.senderInfo?.email || null,
            senderProfilePicture: item.senderInfo?.profilePicture || null
        }));

        return formattedCounts;
    } catch (error) {
        console.error("Error in getUnreadMessageCounts:", error);
        throw new Error("Internal Server Error");
    }
}