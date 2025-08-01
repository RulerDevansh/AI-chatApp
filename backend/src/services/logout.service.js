export default async function logoutUserService(req, res){
    try{
        
    } catch(error){
        console.error("Error in logoutUserService:", error);
        return {status: 500, error: "Internal Server Error"};
    }
}