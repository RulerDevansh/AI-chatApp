import deleteMessageService from "../services/deleteMessage.service.js";

export default async function deleteMessageController(req, res) {
    try {
        const response = await deleteMessageService(req, res);
        if (response.status !== 200) {
            return res.status(response.status).json({ error: response.error });
        }

        return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error in deleteMessageController:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}