import { findUserByEmail, updateUserPasswordRepo } from "../repositories/index.repository.js";
import bcrypt from 'bcrypt';

export default async function updateUserPasswordServie(req){
    try{
        const useremail = req.user.email;
        if(!useremail){
            return { status: 404,  error: "email not found"};
        }
        const user = await findUserByEmail(useremail);
        if(!user){
            return { status: 404, error: "user with the given email not found"}
        }
        
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return { status: 400, error: "Current password and new password are required" };
        }
        
        // Validate new password length
        if (newPassword.length < 6) {
            return { status: 400, error: "New password must be at least 6 characters long" };
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return { status: 400, error: "Current password is incorrect" };
        }
        
        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return { status: 400, error: "New password must be different from current password" };
        }
        
        const response = await updateUserPasswordRepo(user, newPassword);
        if(response.error || !response){
            return { status: response.status || 500, error: response.error || "Something went wrong"}
        }
        return { status: 200, message: "Password updated successfully"}
    } catch(error){
        console.log("Error in updatePasswordService: ", error);
        return { status: 500, error: "Internal Server Error"};
    }
}