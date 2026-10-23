import { Router } from 'express';
import { body } from 'express-validator';
import {
  checkSlug,
  listMine,
  getMine,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  listInvitationWishes,
  deleteInvitationWish,
  listInvitationRsvps,
} from '../controllers/invitationsController';
import { GALLERY_MAX, SELECTABLE_TEMPLATE_KEYS, TEMPLATE_KEYS } from '../models/Invitation';
import { handleValidation } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Yaratishda majburiy, tahrirlashda ixtiyoriy (faqat yuborilgan maydonlar tekshiriladi). */
function invitationRules(partial: boolean) {
  const req = (field: string) => (partial ? body(field).optional() : body(field));
  return [
    req('groomName').trim().notEmpty().withMessage('Kuyov ismini kiriting'),
    req('brideName').trim().notEmpty().withMessage('Kelin ismini kiriting'),
    req('date').matches(DATE_RE).withMessage('Sanani tanlang'),
    req('time').matches(TIME_RE).withMessage('Vaqtni tanlang'),
    req('venueName').trim().notEmpty().withMessage("To'yxona nomini kiriting"),
    // Yaratishda faqat ochiq shablonlar; tahrirda yashirin shablondagi mavjud
    // taklifnoma o'z shablonini saqlay oladi (o'tkazish controller'da tekshiriladi)
    body('template').optional().isIn(partial ? TEMPLATE_KEYS : SELECTABLE_TEMPLATE_KEYS).withMessage("Shablon noto'g'ri"),
    body('status').optional().isIn(['draft', 'published']),
    body('schedule').optional().isArray({ max: 20 }),
    // Bo'sh bandlar controller'da (pickEditable) tashlab yuboriladi
    body('schedule.*.time').optional({ values: 'falsy' }).matches(TIME_RE).withMessage("Dastur vaqti noto'g'ri"),
    body('googleMapUrl').optional({ values: 'falsy' }).isURL().withMessage("Google xarita havolasi noto'g'ri"),
    body('yandexMapUrl').optional({ values: 'falsy' }).isURL().withMessage("Yandex xarita havolasi noto'g'ri"),
    body('greetingMessage').optional().isLength({ max: 3000 }),
    body(['couplePhoto', 'coverPhoto', 'venuePhoto', 'musicUrl']).optional().isString().isLength({ max: 500 }),
    body('gallery').optional().isArray({ max: GALLERY_MAX }).withMessage(`Galereyaga ko'pi bilan ${GALLERY_MAX} ta rasm`),
    body('gallery.*').isString().isLength({ max: 500 }),
    body('features.wishes').optional().isBoolean(),
    body('features.rsvp').optional().isBoolean(),
    body('features.gift').optional().isBoolean(),
  ];
}

router.get('/slug/:slug', checkSlug);

router.use(requireAuth);

router.get('/', listMine);
router.post('/', invitationRules(false), handleValidation, createInvitation);
router.get('/:id', getMine);
router.patch('/:id', invitationRules(true), handleValidation, updateInvitation);
router.delete('/:id', deleteInvitation);
router.get('/:id/wishes', listInvitationWishes);
router.delete('/:id/wishes/:wishId', deleteInvitationWish);
router.get('/:id/rsvps', listInvitationRsvps);

export default router;
