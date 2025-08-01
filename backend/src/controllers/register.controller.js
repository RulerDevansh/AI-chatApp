import registerUserService from "../services/register.service.js";

export default async function registerUserController(req, res) {
    try {
        const response = await registerUserService(req.body, res);
        if (response.data) {
            return res.status(response.status).json({ message: "User registered successfully", data: response.data });
        } else {
            return res.status(400).json({ message: "User registration failed" });
        } 
    } catch (error) {
        console.error("Error in registerUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}