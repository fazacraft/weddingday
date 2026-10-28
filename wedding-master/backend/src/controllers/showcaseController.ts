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

/** PATCH /api/admin/invitations/:id/featured { featured } — namunalarga qo'shish/olib tashlash. */
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
      res.status(422).json({ error: "Namuna qilish uchun taklifnoma nashr qilingan bo'lishi kerak" });
      return;
    }
    inv.featured = featured;
    inv.featuredAt = featured ? new Date() : undefined;
    await inv.save();
    res.json({ id: String(inv._id), featured: inv.featured });
  } catch (err) {
    next(err);
  }
}
