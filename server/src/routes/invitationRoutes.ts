import express from 'express';
import {
  inviteUser,
  acceptInvitation,
  getInvitation,
  getPendingInvitations,
} from '../controllers/invitationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/', inviteUser);
router.post('/:token/accept', acceptInvitation);
router.get('/:token', getInvitation);
router.get('/accountbook/:accountbookId/pending', getPendingInvitations);

export default router;
