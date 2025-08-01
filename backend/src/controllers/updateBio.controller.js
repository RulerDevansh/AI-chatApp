import updateBioService from "../services/updateBio.service.js";

export default async function updateBioController(req, res){
    try{
        const response = await updateBioService(req);
        if(response.status===400 || response.status===500){
            res.status(response.status || 400).json({error: response.error || "something went wrong!"})
        }
        return res.status(response.status || 200).json({message: response.message || "bio updated successfully!!"})
    } catch(error){
        console.error("Error in updateBioController: ", error);
        res.status(500).json({ error: "internal server error"})
    }
}