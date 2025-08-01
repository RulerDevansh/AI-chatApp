import updateProfilePictureService from "../services/updateProfilePicture.service.js";

export default async function updateProfilePictureController(req, res){
    try{
        const response = await updateProfilePictureService(req);
        if(response.error){
            return res.status(response.status || 500).json({error: response.error || "Something went wrong"})
        }
        return res.status(response.status || 200).json({message: response.message || "profile picture updated successfully", data: response.data})
        // console.log("Profile URL: ", profileURL);
    } catch(error){
        console.log("Error in updateProfilePictureController: ", error);
        res.status(500).json({error: "Internal Server Error"});
    }

}