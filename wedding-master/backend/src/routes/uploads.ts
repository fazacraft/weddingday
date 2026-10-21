import { Router } from 'express';
import multer from 'multer';
import { ALLOWED_TYPES, saveUpload } from '../storage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_TYPES.has(file.mimetype)),
});

const router = Router();

/**
 * Wizard login'siz to'ldirilgani uchun yuklash ham ochiq: faqat rasm/mp3,
 * 12MB gacha, bitta fayl.
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    res.status(422).json({ error: 'Faqat JPG, PNG, WEBP rasm yoki MP3/M4A musiqa (12MB gacha)' });
    return;
  }
  try {
    res.status(201).json({ url: await saveUpload(req.file.buffer, req.file.mimetype) });
  } catch (err) {
    next(err);
  }
});

export default router;
