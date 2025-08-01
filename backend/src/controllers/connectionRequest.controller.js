import connectionRequestService from "../services/connectionRequest.service.js";

export default async function connectionRequestController(req, res) {
    try {
        const response  = await connectionRequestService(req, res);
        // console.log("Response from connectionRequestService:", response);
        if (!response.data || !response.status) {
            return res.status(response.status || 500).json({ error: response.error || "Internal Server Error" });
        }
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error in connectionRequestController:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}