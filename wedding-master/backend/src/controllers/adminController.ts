import { Response, NextFunction } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { Invitation } from '../models/Invitation';
import { User, isAdminEmail } from '../models/User';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { AuthedRequest } from '../middleware/auth';
import { removeInvitation } from '../services/invitations';
import { decideReview } from '../services/review';
import { syncUploadedMusic } from '../services/musicLibrary';
import { Track } from '../models/Track';

const PAGE_SIZE = 25;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pageOf(req: AuthedRequest): number {
  return Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
}

/** Taklifnomalar bo'yicha tilak va javoblar soni. */
async function countsFor(ids: Types.ObjectId[]) {
  const [wishes, rsvps] = await Promise.all([
    Wish.aggregate([{ $match: { invitation: { $in: ids } } }, { $group: { _id: '$invitation', n: { $sum: 1 } } }]),
    Rsvp.aggregate([{ $match: { invitation: { $in: ids } } }, { $group: { _id: '$invitation', n: { $sum: 1 } } }]),
  ]);
  const w = new Map(wishes.map((x) => [String(x._id), x.n as number]));
  const r = new Map(rsvps.map((x) => [String(x._id), x.n as number]));
  return (id: Types.ObjectId) => ({ wishes: w.get(String(id)) ?? 0, replies: r.get(String(id)) ?? 0 });
}

export async function stats(_req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await syncUploadedMusic();
    const [users, invitations, published, pending, wishes, rsvps, musicPending, featured] = await Promise.all([
      User.countDocuments(),
      Invitation.countDocuments(),
      Invitation.countDocuments({ status: 'published' }),
      Invitation.countDocuments({ review: 'pending' }),
      Wish.countDocuments(),
      Rsvp.countDocuments(),
      Track.countDocuments({ status: 'pending' }),
      Invitation.countDocuments({ featured: true, status: 'published' }),
    ]);
    res.json({ users, invitations, published, pending, wishes, rsvps, musicPending, featured });
  } catch (err) {
    next(err);
  }
}

export async function listInvitations(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = String(req.query.q ?? '').trim();
    const filter: Record<string, unknown> = {};
    if (req.query.status === 'published' || req.query.status === 'draft') filter.status = req.query.status;
    if (req.query.status === 'pending') filter.review = 'pending';
    if (req.query.status === 'featured') filter.featured = true;
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      const owners = await User.find({ $or: [{ email: re }, { name: re }] }).select('_id');
      filter.$or = [
        { slug: re },
        { groomName: re },
        { brideName: re },
        { venueName: re },
        { owner: { $in: owners.map((o) => o._id) } },
      ];
    }
    if (isValidObjectId(req.query.owner)) filter.owner = req.query.owner;

    const page = pageOf(req);
    const [total, list] = await Promise.all([
      Invitation.countDocuments(filter),
      Invitation.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate<{ owner: { _id: Types.ObjectId; name: string; email: string } | null }>('owner', 'name email'),
    ]);
    const counts = await countsFor(list.map((i) => i._id as Types.ObjectId));
    res.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      items: list.map((inv) => ({
        id: String(inv._id),
        slug: inv.slug,
        template: inv.template,
        status: inv.status,
        review: inv.review,
        groomName: inv.groomName,
        brideName: inv.brideName,
        date: inv.date,
        venueName: inv.venueName,
        openCount: inv.openCount,
        featured: inv.featured,
        createdAt: inv.createdAt,
        owner: inv.owner ? { id: String(inv.owner._id), name: inv.owner.name, email: inv.owner.email } : null,
        ...counts(inv._id as Types.ObjectId),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function setInvitationStatus(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = (req.body as { status?: string }).status;
    if (!isValidObjectId(req.params.id) || (status !== 'published' && status !== 'draft')) {
      res.status(422).json({ error: "Noto'g'ri so'rov" });
      return;
    }
    // Admin nashr qilsa, bu tasdiq hisoblanadi
    const update = status === 'published' ? { status, review: 'approved' } : { status };
    const inv = await Invitation.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!inv) {
      res.status(404).json({ error: 'Taklifnoma topilmadi' });
      return;
    }
    res.json({ id: String(inv._id), status: inv.status, review: inv.review });
  } catch (err) {
    next(err);
  }
}

export async function reviewInvitation(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const decision = (req.body as { decision?: string }).decision;
    if (decision !== 'approve' && decision !== 'reject') {
      res.status(422).json({ error: "Noto'g'ri so'rov" });
      return;
    }
    const inv = await decideReview(String(req.params.id), decision);
    if (!inv) {
      res.status(404).json({ error: 'Taklifnoma topilmadi' });
      return;
    }
    res.json({ id: String(inv._id), status: inv.status, review: inv.review });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvitation(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = isValidObjectId(req.params.id) ? await Invitation.findById(req.params.id) : null;
    if (!inv) {
      res.status(404).json({ error: 'Taklifnoma topilmadi' });
      return;
    }
    await removeInvitation(inv);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = String(req.query.q ?? '').trim();
    const filter = q ? { $or: [{ email: new RegExp(escapeRegex(q), 'i') }, { name: new RegExp(escapeRegex(q), 'i') }] } : {};
    const page = pageOf(req);
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE),
    ]);
    const counts = await Invitation.aggregate([
      { $match: { owner: { $in: users.map((u) => u._id) } } },
      { $group: { _id: '$owner', n: { $sum: 1 } } },
    ]);
    const byOwner = new Map(counts.map((c) => [String(c._id), c.n as number]));
    res.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      items: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        isAdmin: isAdminEmail(u.email),
        createdAt: u.createdAt,
        invitations: byOwner.get(String(u._id)) ?? 0,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/** Foydalanuvchini va uning barcha taklifnomalarini o'chiradi. Adminlarni o'chirib bo'lmaydi. */
export async function deleteUser(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null;
    if (!user) {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      return;
    }
    if (isAdminEmail(user.email)) {
      res.status(403).json({ error: "Admin hisobini o'chirib bo'lmaydi" });
      return;
    }
    const invitations = await Invitation.find({ owner: user._id });
    for (const inv of invitations) await removeInvitation(inv);
    await user.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
