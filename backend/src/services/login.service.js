import { findUserByEmail } from "../repositories/index.repository.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function loginUserService(req, res) {
    try{
        const {email, password} = req;
        
        // Validate user data
        if(!email || !password){
            return {status: 400, error: "Email and password are required"};
        }
        // Check if user exists
        const user = await findUserByEmail(email);

        // If user does not exist or password is invalid
        if(!user){
            return {status: 404, error: "User not found"};
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
   
        if(!isPasswordValid){
            return {status: 401, error: "Invalid password"};
        }
   
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
        };
        return {status: 200, data: userData, token };

    } catch(error){
        console.error("Error in loginUserService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}