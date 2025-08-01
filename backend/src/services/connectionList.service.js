import { getConnectionList, findUserByUserId } from "../repositories/index.repository.js";

export default async function connectionListService(req, res) {
  try{
    const connections = await getConnectionList(req.user.id);
    if (connections.length===0) {
        return {message: "No connections exists", status: 200, data: []};
    }
    const formattedConnections = await Promise.all(connections.map(async connection => {
        const friend = await findUserByUserId(connection.friendId);
        return {
            _id: connection._id,
            friendId: connection.friendId,
            friendName: friend ? friend.username : "Unknown User",
            bio: friend ? friend.bio : null,
            profilePicture: friend ? friend.profilePicture : null,
            email: friend ? friend.email : null
        };
    }));
    return {data: formattedConnections, status: 200};
  } catch(error){
    console.error("Error in connectionListService:", error);
    throw new Error("Internal Server Error");
  }
}