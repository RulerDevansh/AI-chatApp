import { findUserByEmail, updateBioRepo } from "../repositories/index.repository.js";


export default async function updateBioService(req){
    try{
        const useremail = req.user.email;
        const user = await findUserByEmail(useremail);
        if(!user){
            return { status: 400, error: "user not found!"}
        }
        const userId = user._id;
        const updatedUser = await updateBioRepo(userId, req.body.bio);
        if(!updatedUser){
            return { status: 400, error: "bio updation failed!"}
        }
        return {status: 200, message: "User bio updated successfully!"};
    } catch(error){
        console.error("Error in addBioService: ", error);
        return { status: 500, error: error};
    }
}