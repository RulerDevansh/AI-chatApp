import { loginUserService } from "../services/login.service.js";

export default async function loginUserController(req, res) {
    try{
        const response = await loginUserService(req.body, res);
        if(response.status==400 || response.status==401 || response.status==404){
            return res.status(response.status).json({ message: response.error || "Login failed" });
        } 
        if (!response || !response.token || !response.data) {
            return res.status(401).json({ message: 'Invalid login attempt' });
        }

        res.cookie('accessToken', response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.status(response.status).json({
            message: "Login successful",
            data: response.data,
            token: response.token // Include token in response for localStorage storage
        });

    } catch(error){
        console.error("Error in loginUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}