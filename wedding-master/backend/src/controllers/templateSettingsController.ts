import { Request, Response, NextFunction } from 'express';
import { GALLERY_MAX, TEMPLATE_KEYS, TemplateKey } from '../models/Invitation';
import { TEMPLATE_PHOTO_KEYS, TEMPLATE_TEXT_KEYS, TemplateSettings } from '../models/TemplateSettings';
import { AuthedRequest } from '../middleware/auth';
import { getTemplateSettings, invalidateTemplateSettings, publicTemplateSettings } from '../services/templateSettings';

/** Sayt ichidagi fayl: /uploads/<nom>, /templates/..., /<musiqa>.mp3 — boshqa domen yoki "..": yo'q. */
const MEDIA_PATH = /^\/[A-Za-z0-9._/-]+\.(mp3|m4a|jpe?g|png|webp)$/i;
const TEXT_MAX: Record<string, number> = { eventTitle: 80, inviteText: 300, greetingHeading: 120, greetingMessage: 2000 };

function mediaOk(value: unknown): value is string {
  return value === '' || (typeof value === 'string' && MEDIA_PATH.test(value) && !value.includes('..'));
}

/** GET /api/templates/settings — admin o'zgartirgan shablon standartlari (HTML'ga ham qo'shiladi). */
export async function listTemplateSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.setHeader('Cache-Control', 'no-cache');
    res.json(await getTemplateSettings());
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/templates/:key { texts, music, photos } — bo'sh qiymat o'rnatilgan standartga qaytaradi. */
export async function saveTemplateSettings(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = String(req.params.key) as TemplateKey;
    if (!TEMPLATE_KEYS.includes(key)) {
      res.status(404).json({ error: 'Bunday shablon yo\'q' });
      return;
    }
    const body = (req.body ?? {}) as { texts?: Record<string, unknown>; music?: unknown; photos?: Record<string, unknown> };

    const texts: Record<string, string> = {};
    for (const field of TEMPLATE_TEXT_KEYS) {
      const value = body.texts?.[field] ?? '';
      if (typeof value !== 'string' || value.length > TEXT_MAX[field]) {
        res.status(422).json({ error: `Matn juda uzun yoki noto'g'ri: ${field}` });
        return;
      }
      texts[field] = value.trim();
    }
    const music = body.music ?? '';
    const photos: Record<string, unknown> = {};
    for (const field of TEMPLATE_PHOTO_KEYS) photos[field] = body.photos?.[field] ?? '';
    const gallery = body.photos?.gallery ?? [];
    if (
      !mediaOk(music) ||
      !TEMPLATE_PHOTO_KEYS.every((field) => mediaOk(photos[field])) ||
      !Array.isArray(gallery) ||
      gallery.length > GALLERY_MAX ||
      !gallery.every((url) => mediaOk(url) && url !== '')
    ) {
      res.status(422).json({ error: "Fayl manzili noto'g'ri" });
      return;
    }

    const doc = await TemplateSettings.findOneAndUpdate(
      { key },
      { key, texts, music, photos: { ...photos, gallery } },
      { upsert: true, new: true, runValidators: true }
    );
    invalidateTemplateSettings();
    res.json(publicTemplateSettings(doc));
  } catch (err) {
    next(err);
  }
}
