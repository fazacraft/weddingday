import { Response, NextFunction } from 'express';
import { Invitation, IInvitation, publicInvitation } from '../models/Invitation';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { AuthedRequest } from '../middleware/auth';
import { emitWishCreated } from '../socket';

/**
 * Slug bo'yicha mehmonlarga ochiq taklifnomani topadi. Qoralama faqat egasiga
 * (token bilan) ko'rinadi, boshqalarga 404.
 */
async function findVisible(req: AuthedRequest, res: Response): Promise<IInvitation | null> {
  const slug = String(req.params.slug ?? '').toLowerCase();
  const inv = await Invitation.findOne({ slug });
  const visible = inv && (inv.status === 'published' || String(inv.owner) === req.userId);
  if (!visible) {
    res.status(404).json({ error: 'Taklifnoma topilmadi' });
    return null;
  }
  return inv;
}

export async function getPublicInvitation(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findVisible(req, res);
    if (!inv) return;
    res.json(publicInvitation(inv));
  } catch (err) {
    next(err);
  }
}

export async function countOpen(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = String(req.params.slug ?? '').toLowerCase();
    // $inc atomar — bir vaqtda bosilsa ham hisob yo'qolmaydi
    const updated = await Invitation.updateOne({ slug, status: 'published' }, { $inc: { openCount: 1 } });
    res.json({ ok: updated.modifiedCount > 0 });
  } catch (err) {
    next(err);
  }
}

export async function getWishes(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findVisible(req, res);
    if (!inv) return;
    const wishes = await Wish.find({ invitation: inv._id })
      .select('name message createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(wishes);
  } catch (err) {
    next(err);
  }
}

export async function createWish(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findVisible(req, res);
    if (!inv) return;
    if (!inv.features.wishes) {
      res.status(403).json({ error: "Bu taklifnomada tilaklar o'chirilgan" });
      return;
    }
    const { name, message } = req.body as { name: string; message: string };
    const wish = await Wish.create({ invitation: inv._id, name, message });
    const payload = { _id: wish._id, name: wish.name, message: wish.message, createdAt: wish.createdAt };
    emitWishCreated(String(inv._id), payload);
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
}

export async function createRsvp(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findVisible(req, res);
    if (!inv) return;
    if (!inv.features.rsvp) {
      res.status(403).json({ error: "Bu taklifnomada javob berish o'chirilgan" });
      return;
    }
    const { name, attending, guests } = req.body as { name: string; attending: boolean; guests?: number };
    const rsvp = await Rsvp.create({
      invitation: inv._id,
      name,
      attending,
      guests: attending ? guests ?? 1 : 1,
    });
    res.status(201).json({ _id: rsvp._id, name: rsvp.name, attending: rsvp.attending, guests: rsvp.guests });
  } catch (err) {
    next(err);
  }
}
