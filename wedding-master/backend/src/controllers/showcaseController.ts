import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { Invitation } from '../models/Invitation';
import { AuthedRequest } from '../middleware/auth';
import { getShowcase } from '../services/showcase';

/** GET /api/showcase?page=1&limit=24 — saytdagi "Namunalar" (admin tanlagan tayyor taklifnomalar). */
export async function listShowcase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(48, Math.max(1, Number.parseInt(String(req.query.limit ?? '24'), 10) || 24));
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const all = await getShowcase();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ total: all.length, page, pageSize: limit, items: all.slice((page - 1) * limit, page * limit) });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/invitations/:id/featured { featured } — ko'rgazma boshiga mahkamlash/bo'shatish. */
export async function setFeatured(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const featured = (req.body as { featured?: unknown }).featured;
    if (typeof featured !== 'boolean') {
      res.status(422).json({ error: "Noto'g'ri so'rov" });
      return;
    }
    const inv = isValidObjectId(req.params.id) ? await Invitation.findById(req.params.id) : null;
    if (!inv) {
      res.status(404).json({ error: 'Taklifnoma topilmadi' });
      return;
    }
    if (featured && inv.status !== 'published') {
      res.status(422).json({ error: "Mahkamlash uchun taklifnoma nashr qilingan bo'lishi kerak" });
      return;
    }
    // Egasining tanlovi ustun: u "ko'rinmasin" degan bo'lsa, admin ham chiqara olmaydi
    if (featured && inv.hideFromShowcase) {
      res.status(422).json({ error: "Egasi taklifnomasi namunalarda ko'rinmasligini tanlagan" });
      return;
    }
    inv.featured = featured;
    inv.featuredAt = featured ? new Date() : undefined;
    if (featured) inv.showcaseHidden = false;
    await inv.save();
    res.json({ id: String(inv._id), featured: inv.featured });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/invitations/:id/showcase { hidden } — saytdagi "Namunalar"dan yashirish/qaytarish. */
export async function setShowcaseHidden(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const hidden = (req.body as { hidden?: unknown }).hidden;
    if (typeof hidden !== 'boolean') {
      res.status(422).json({ error: "Noto'g'ri so'rov" });
      return;
    }
    const inv = isValidObjectId(req.params.id) ? await Invitation.findById(req.params.id) : null;
    if (!inv) {
      res.status(404).json({ error: 'Taklifnoma topilmadi' });
      return;
    }
    inv.showcaseHidden = hidden;
    // Yashirilgan taklifnoma mahkamlangan bo'lib qolmasin
    if (hidden) {
      inv.featured = false;
      inv.featuredAt = undefined;
    }
    await inv.save();
    res.json({ id: String(inv._id), showcaseHidden: inv.showcaseHidden, featured: inv.featured });
  } catch (err) {
    next(err);
  }
}
