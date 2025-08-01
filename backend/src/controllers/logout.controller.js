export default async function logoutUserController(req, res) {
    try{
        const response = await logoutUserService(req, res);
    } catch (error) {
        console.error("Error in logoutUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}