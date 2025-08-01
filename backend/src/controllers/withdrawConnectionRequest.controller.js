import withdrawConnectionRequestService from '../services/withdrawConnectionRequest.service.js';

export default async function withdrawConnectionRequestController(req, res) {
    try{
        const response = await withdrawConnectionRequestService(req, res);
        console.log("Response from withdrawConnectionRequestService:", response);
        if(response.status !== 200) {
            res.status(response.status).json({ error: response.error });
        }
        res.status(response.status).json(response.data);
    } catch(error){
        console.error("Error in withdrawConnectionRequestController:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}