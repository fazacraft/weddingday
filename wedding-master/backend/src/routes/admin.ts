import { Router } from 'express';
import {
  stats,
  listInvitations,
  setInvitationStatus,
  deleteInvitation,
  listUsers,
  deleteUser,
} from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAdmin);

router.get('/stats', stats);
router.get('/invitations', listInvitations);
router.patch('/invitations/:id', setInvitationStatus);
router.delete('/invitations/:id', deleteInvitation);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);

export default router;
