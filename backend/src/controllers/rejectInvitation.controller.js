import rejectInvitationService from '../services/rejectInvitation.service.js';

export default async function rejectInvitationController(req, res) {
  try {
    const response = await rejectInvitationService(req, res);
    if(response.status === 200) {
      return res.status(response.status).json(response.data);
    }
    return res.status(response.status).json({ error: response.error });
  } catch (error) {
    console.error("Error in rejectInvitationController:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}