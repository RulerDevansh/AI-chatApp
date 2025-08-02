import express from 'express';
import multer from 'multer';
import registerUserController from '../controllers/register.controller.js';
import loginUserController from '../controllers/login.controller.js';
import userProfileController from '../controllers/profile.controller.js';
import connectionRequestController from '../controllers/connectionRequest.controller.js';
import friendProfiileController from '../controllers/friendProfile.controller.js';
import acceptInvitationController from '../controllers/acceptInvitation.controller.js';
import chatHistoryController from '../controllers/chatHistory.controller.js';
import sendMessageController from '../controllers/sendMessage.controller.js';
import connectionListController from '../controllers/connectionList.controller.js';
import withdrawConnectionRequestController from '../controllers/withdrawConnectionRequest.controller.js';
import rejectInvitationController from '../controllers/rejectInvitation.controller.js';
import deleteMessageController from '../controllers/deleteMessage.controller.js';
import updateBioController from '../controllers/updateBio.controller.js'
import markMsgAsSeenController from '../controllers/markMsgSeen.controller.js';
import updateProfilePictureController from '../controllers/updateProfilePicture.controller.js';
import updateUserPasswordController from '../controllers/updatePassword.controller.js';
import { unreadMessagesController } from '../controllers/unreadMessages.controller.js';
import AI from '../AI/index.js';
import { invitationReceivedController, invitationSentController } from '../controllers/invitationList.controller.js';
import { isLoggedIn } from '../validation/index.js';
const upload = multer({ dest: 'public/' });



const userRouter = express.Router();

userRouter.post('/register', registerUserController)
userRouter.post('/login', loginUserController)
userRouter.get('/profile', isLoggedIn, userProfileController);
userRouter.post('/friendProfile', isLoggedIn, friendProfiileController); // Changed GET to POST
userRouter.post('/connectionRequest', isLoggedIn, connectionRequestController);
userRouter.get('/invitationSent', isLoggedIn, invitationSentController);
userRouter.get('/invitationReceived', isLoggedIn, invitationReceivedController);
userRouter.post('/acceptInvitation', isLoggedIn, acceptInvitationController) // Already POST
userRouter.post('/chatHistory', isLoggedIn, chatHistoryController) // Changed GET to POST
userRouter.post('/sendMessage', isLoggedIn, upload.single('file'), sendMessageController);
userRouter.get('/connectionList', isLoggedIn, connectionListController);
userRouter.post('/aiResponse', isLoggedIn, AI)
userRouter.post('/withdrawConnectionRequest', isLoggedIn, withdrawConnectionRequestController); // Changed GET to POST
userRouter.post('/rejectInvitation', isLoggedIn, rejectInvitationController); // Changed GET to POST
userRouter.post('/deleteMessage', isLoggedIn, deleteMessageController); // Changed GET to POST
userRouter.post('/updateBio', isLoggedIn, updateBioController);
userRouter.post('/markMsgSeen', isLoggedIn, markMsgAsSeenController);
userRouter.get('/unreadMessages', isLoggedIn, unreadMessagesController);
userRouter.post('/updateProfilePicture', isLoggedIn, upload.single('file'), updateProfilePictureController);
userRouter.post('/updatePassword', isLoggedIn, updateUserPasswordController); // pxlvy

export default userRouter;