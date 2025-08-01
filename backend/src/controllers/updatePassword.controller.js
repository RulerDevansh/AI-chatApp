import updateUserPasswordServie from "../services/updatePassword.service.js";

export default async function updateUserPasswordController(req, res){
    try{
        const response = await updateUserPasswordServie(req);
        if(!response.message || response.error){
            return res.status(response.status || 400).json({error: response.error || "Something went wrong"})
        }
        return res.status(response.status || 200).json({message: response.message || "password updated successfully"})
    } catch(error){
        console.log("Error in updateUserPasswordController: ", error);
        return res.status(500).json({error: "Internal server error"})
    }
}