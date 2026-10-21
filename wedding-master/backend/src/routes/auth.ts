import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController';
import { handleValidation } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Ismingizni kiriting'),
    body('email').trim().isEmail().withMessage("Email noto'g'ri"),
    body('password').isLength({ min: 6 }).withMessage("Parol kamida 6 ta belgidan iborat bo'lsin"),
  ],
  handleValidation,
  register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage("Email noto'g'ri"),
    body('password').notEmpty().withMessage('Parolni kiriting'),
  ],
  handleValidation,
  login
);

router.get('/me', requireAuth, me);

export default router;
