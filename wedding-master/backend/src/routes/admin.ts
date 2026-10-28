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
import { adminDeleteTrack, adminListMusic, adminUpdateTrack } from '../controllers/musicController';
import { setFeatured } from '../controllers/showcaseController';

const router = Router();

// Login himoyadan oldin — qolgan hamma admin marshrutlari token talab qiladi
router.post('/login', adminLogin);

router.use(requireAdmin);

router.get('/stats', stats);
router.get('/invitations', listInvitations);
router.patch('/invitations/:id', setInvitationStatus);
router.post('/invitations/:id/review', reviewInvitation);
router.patch('/invitations/:id/featured', setFeatured);
router.delete('/invitations/:id', deleteInvitation);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/music', adminListMusic);
router.patch('/music/:id', adminUpdateTrack);
router.delete('/music/:id', adminDeleteTrack);

export default router;
