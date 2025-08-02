import unreadMessagesService from "../services/unreadMessages.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const unreadMessagesController = asyncHandler(async (req, res) => {
    const result = await unreadMessagesService(req, res);
    
    if (result.status === 200) {
        return res.status(200).json(new ApiResponse(200, result.data, result.message));
    } else {
        return res.status(result.status).json(new ApiResponse(result.status, null, result.error));
    }
});
