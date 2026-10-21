import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublicInvitation,
  countOpen,
  getWishes,
  createWish,
  createRsvp,
} from '../controllers/publicController';
import { handleValidation } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

router.get('/:slug', getPublicInvitation);
router.post('/:slug/open', countOpen);
router.get('/:slug/wishes', getWishes);

router.post(
  '/:slug/wishes',
  [
    body('name').trim().notEmpty().withMessage('Ismingizni kiriting').isLength({ max: 80 }),
    body('message').trim().notEmpty().withMessage('Tilakni yozing').isLength({ max: 1000 }),
  ],
  handleValidation,
  createWish
);

router.post(
  '/:slug/rsvp',
  [
    body('name').trim().notEmpty().withMessage('Ismingizni kiriting').isLength({ max: 80 }),
    body('attending').isBoolean().withMessage('Kelasizmi yoki yo‘qmi, tanlang'),
    body('guests').optional().isInt({ min: 1, max: 20 }).toInt(),
  ],
  handleValidation,
  createRsvp
);

export default router;
