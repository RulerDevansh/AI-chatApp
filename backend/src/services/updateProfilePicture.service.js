import uploadUserProfilePictureOnCloudinary from "../cloudinary/uploadUserProfilePicture.js";
import { findUserByEmail, updateProfilePictureRepo } from "../repositories/index.repository.js";

export default async function updateProfilePictureService(req){
    try{
        const useremail = req.user.email;
        if(!useremail){
            return { status: 400, error: "email not found"}
        }
        const user = await findUserByEmail(useremail);
        if(!user){
            return { status: 400, error: "user with the given email doesnot exists"}
        }
        const pictureURL = await uploadUserProfilePictureOnCloudinary(req, user._id);
        if(!pictureURL){
            return { status: 400, error: "pictureURL not defined"}
        }
        const response = await updateProfilePictureRepo(user._id, pictureURL)
        if(!response || response.error){
            return { status: response.status || 500, error: response.error || "Internal Server Error"};
        }
        return { status: 200, message: "User Profile Picture Updated Successfully", data: response.profilePicture};
    } catch(error){
        console.log("Error in updateProfilePictureService: ", error);
        return { status: 500, error: "Internal Server Error"}
    }
}