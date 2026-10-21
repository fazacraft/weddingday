import { Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import {
  Invitation,
  IInvitation,
  RESERVED_SLUGS,
  SLUG_PATTERN,
  publicInvitation,
} from '../models/Invitation';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { AuthedRequest } from '../middleware/auth';
import { removeInvitation } from '../services/invitations';

/** Klientdan qabul qilinadigan maydonlar — owner, openCount kabilarni o'zgartirib bo'lmaydi. */
const EDITABLE_FIELDS = [
  'slug', 'template', 'status',
  'groomName', 'brideName', 'date', 'time', 'eventTitle', 'inviteText',
  'greetingHeading', 'greetingMessage',
  'venueName', 'venueAddress', 'venueLandmark', 'googleMapUrl', 'yandexMapUrl',
  'schedule', 'couplePhoto', 'musicUrl',
  'cardNumber', 'cardHolder', 'dressCode', 'features',
] as const;

function pickEditable(body: Record<string, unknown>): Partial<IInvitation> {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (typeof out.slug === 'string') out.slug = out.slug.trim().toLowerCase();
  if (Array.isArray(out.schedule)) {
    out.schedule = (out.schedule as { time?: unknown; title?: unknown }[])
      .filter((item) => item && String(item.title ?? '').trim() && item.time)
      .map((item) => ({ time: String(item.time ?? ''), title: String(item.title).trim() }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }
  return out as Partial<IInvitation>;
}

export function slugProblem(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "3–60 belgi: a–z, 0–9 va chiziqcha (-)";
  if (RESERVED_SLUGS.has(slug)) return 'Bu manzil tizim uchun band qilingan';
  return null;
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (exceptId) filter._id = { $ne: exceptId };
  return Boolean(await Invitation.exists(filter));
}

/** Egasiga tegishli taklifnomani topadi, aks holda 404 qaytaradi. */
async function findOwned(req: AuthedRequest, res: Response): Promise<IInvitation | null> {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(404).json({ error: 'Taklifnoma topilmadi' });
    return null;
  }
  const inv = await Invitation.findOne({ _id: id, owner: req.userId });
  if (!inv) res.status(404).json({ error: 'Taklifnoma topilmadi' });
  return inv;
}

function ownerView(inv: IInvitation, stats?: Record<string, number>) {
  return {
    ...publicInvitation(inv),
    cardNumber: inv.cardNumber,
    cardHolder: inv.cardHolder,
    openCount: inv.openCount,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    ...(stats ? { stats } : {}),
  };
}

async function statsFor(ids: unknown[]) {
  const [wishes, rsvps] = await Promise.all([
    Wish.aggregate([{ $match: { invitation: { $in: ids } } }, { $group: { _id: '$invitation', n: { $sum: 1 } } }]),
    Rsvp.aggregate([
      { $match: { invitation: { $in: ids } } },
      {
        $group: {
          _id: '$invitation',
          coming: { $sum: { $cond: ['$attending', '$guests', 0] } },
          declined: { $sum: { $cond: ['$attending', 0, 1] } },
          replies: { $sum: 1 },
        },
      },
    ]),
  ]);
  const byId = new Map<string, Record<string, number>>();
  for (const id of ids) byId.set(String(id), { wishes: 0, replies: 0, coming: 0, declined: 0 });
  for (const w of wishes) byId.get(String(w._id))!.wishes = w.n;
  for (const r of rsvps) Object.assign(byId.get(String(r._id))!, { replies: r.replies, coming: r.coming, declined: r.declined });
  return byId;
}

export async function checkSlug(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = String(req.params.slug ?? '').toLowerCase();
    const problem = slugProblem(slug);
    if (problem) {
      res.json({ slug, available: false, reason: problem });
      return;
    }
    const exceptId = typeof req.query.except === 'string' && isValidObjectId(req.query.except)
      ? req.query.except
      : undefined;
    const taken = await slugTaken(slug, exceptId);
    res.json({ slug, available: !taken, reason: taken ? 'Bu manzil band' : null });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await Invitation.find({ owner: req.userId }).sort({ updatedAt: -1 });
    const stats = await statsFor(list.map((inv) => inv._id));
    res.json(list.map((inv) => ownerView(inv, stats.get(String(inv._id)))));
  } catch (err) {
    next(err);
  }
}

export async function getMine(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    const stats = await statsFor([inv._id]);
    res.json(ownerView(inv, stats.get(String(inv._id))));
  } catch (err) {
    next(err);
  }
}

export async function createInvitation(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = pickEditable(req.body as Record<string, unknown>);
    const slug = String(data.slug ?? '');
    const problem = slugProblem(slug);
    if (problem) {
      res.status(422).json({ error: problem, field: 'slug' });
      return;
    }
    if (await slugTaken(slug)) {
      res.status(409).json({ error: 'Bu manzil band. Boshqasini tanlang.', field: 'slug' });
      return;
    }
    const inv = await Invitation.create({ ...data, owner: req.userId });
    res.status(201).json(ownerView(inv));
  } catch (err) {
    next(err);
  }
}

export async function updateInvitation(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    const data = pickEditable(req.body as Record<string, unknown>);
    if (data.slug !== undefined && data.slug !== inv.slug) {
      const problem = slugProblem(data.slug);
      if (problem) {
        res.status(422).json({ error: problem, field: 'slug' });
        return;
      }
      if (await slugTaken(data.slug, String(inv._id))) {
        res.status(409).json({ error: 'Bu manzil band. Boshqasini tanlang.', field: 'slug' });
        return;
      }
    }
    inv.set(data);
    await inv.save();
    const stats = await statsFor([inv._id]);
    res.json(ownerView(inv, stats.get(String(inv._id))));
  } catch (err) {
    next(err);
  }
}

export async function deleteInvitation(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    await removeInvitation(inv);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listInvitationWishes(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    res.json(await Wish.find({ invitation: inv._id }).sort({ createdAt: -1 }).lean());
  } catch (err) {
    next(err);
  }
}

export async function deleteInvitationWish(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    if (!isValidObjectId(req.params.wishId)) {
      res.status(404).json({ error: 'Tilak topilmadi' });
      return;
    }
    await Wish.deleteOne({ _id: req.params.wishId, invitation: inv._id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listInvitationRsvps(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    res.json(await Rsvp.find({ invitation: inv._id }).sort({ createdAt: -1 }).lean());
  } catch (err) {
    next(err);
  }
}
