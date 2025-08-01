import connectionListService from "../services/connectionList.service.js";

export default async function connectionListController(req, res){
    try{
        const response = await connectionListService(req, res);
        if(response.status === 200 && response.data.length === 0){
            return res.status(200).json({message: response.message, data: []});
        }
        return res.status(response.status).json({data: response.data});
    } catch(error){
        console.error("Error in getConnectionListController:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}