import { Router } from 'express';
import {
  stats,
  listInvitations,
  setInvitationStatus,
  reviewInvitation,
  deleteInvitation,
  listUsers,
  deleteUser,
} from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';
import { adminLogin } from '../controllers/adminAuthController';

const router = Router();

// Login himoyadan oldin — qolgan hamma admin marshrutlari token talab qiladi
router.post('/login', adminLogin);

router.use(requireAdmin);

router.get('/stats', stats);
router.get('/invitations', listInvitations);
router.patch('/invitations/:id', setInvitationStatus);
router.post('/invitations/:id/review', reviewInvitation);
router.delete('/invitations/:id', deleteInvitation);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);

export default router;
