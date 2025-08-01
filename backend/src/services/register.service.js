
import { ApiResponse } from '../utils/ApiResponse.js';
import { registerUser as registerNewUser, findUserByEmail, findUserByUsername } from '../repositories/index.repository.js';

export default async function registerUserService(req, res) {
    try{
        const userData = req;
        
        // Validate user data  
        if (!userData.username || !userData.password || !userData.email) {
            return {status: 400, error: "Username, password, and email are required"};
        }

        // // Check if user already exists
        const user = await findUserByEmail(userData.email);
        if(!user){
            const userbyname = await findUserByUsername(userData.username);

            if(!userbyname){
                const newUser = await registerNewUser(userData);
                if(!newUser){
                    return {status: 400, error: "User registration failed"}; 
                }
                return {status: 201, data: newUser};
            }
            return {status: 409, error: "Username already taken"};
        }

        return {status: 409, error: "Email already exists"};

    } catch(error){
        console.error("Error in registerUserService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}