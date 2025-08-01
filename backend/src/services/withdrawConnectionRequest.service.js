import { findUserByEmail, findConnectionByIdAndDeleteConnection, findConnectionById } from '../repositories/index.repository.js';

export default async function withdrawConnectionRequestService(req, res) {
  try {
    const useremail = req.user.email;
    
    const friendId = req.body.friendId;

    const user = await findUserByEmail(useremail);

    if(!user) {
      return { status: 404, error: "User not found" };
    }
    const userId = user._id;
    const connection = await findConnectionById(userId, friendId);
    if (!connection) {
      return { status: 404, error: "Connection not found" };
    }
    if (connection.status !== 'pending') {
      return { status: 400, error: "Connection request is not pending" };
    }
    const updatedConnection = await findConnectionByIdAndDeleteConnection(connection._id);
    if (!updatedConnection) {
      return { status: 400, error: "Failed to withdraw connection request" };
    }
    return { status: 200, data: { message: "Connection request withdrawn successfully" } };
  } catch (error) {
    
  }
}