import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import {
  HIDDEN_TEMPLATE_KEYS,
  Invitation,
  IInvitation,
  RESERVED_SLUGS,
  SLUG_PATTERN,
  publicInvitation,
} from '../models/Invitation';
import { rememberUploadedMusic } from '../services/musicLibrary';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { AuthedRequest } from '../middleware/auth';
import { removeInvitation } from '../services/invitations';
import { applyPublishRequest, notifyApprovalNeeded } from '../services/review';
import { deleteReceiptFile, sniffReceipt, storeReceipt } from '../services/receipts';
import { ADMIN_CHAT_ID, formattedCard, PAYMENT_HOLDER, PAYMENT_PRICE, sendDocument, telegramEnabled } from '../services/telegram';
import { User, isAdminEmail } from '../models/User';

/** Klientdan qabul qilinadigan maydonlar — owner, openCount kabilarni o'zgartirib bo'lmaydi. */
const EDITABLE_FIELDS = [
  'slug', 'template', 'status',
  'groomName', 'brideName', 'date', 'time', 'eventTitle', 'inviteText',
  'greetingHeading', 'greetingMessage',
  'venueName', 'venueAddress', 'venueLandmark', 'googleMapUrl', 'yandexMapUrl',
  'schedule', 'couplePhoto', 'coverPhoto', 'venuePhoto', 'gallery', 'musicUrl', 'musicTitle', 'hideFromShowcase',
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
  if (Array.isArray(out.gallery)) {
    out.gallery = (out.gallery as unknown[]).filter((url): url is string => typeof url === 'string' && url.trim() !== '');
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

async function requesterIsAdmin(req: AuthedRequest): Promise<boolean> {
  const user = await User.findById(req.userId).select('email');
  return Boolean(user && isAdminEmail(user.email));
}

/**
 * status=published so'ralsa, tasdiq qoidasini qo'llaydi (status va review'ni
 * o'zi o'rnatadi). Admin'ga Telegram xabari kerak bo'lsa true qaytaradi.
 */
async function handlePublish(req: AuthedRequest, inv: IInvitation, wantsPublish: boolean): Promise<boolean> {
  if (!wantsPublish) return false;
  return applyPublishRequest(inv, await requesterIsAdmin(req));
}

function ownerView(inv: IInvitation, stats?: Record<string, number>) {
  return {
    ...publicInvitation(inv),
    cardNumber: inv.cardNumber,
    cardHolder: inv.cardHolder,
    musicTitle: inv.musicTitle,
    hideFromShowcase: inv.hideFromShowcase,
    review: inv.review,
    reviewRequestedAt: inv.reviewRequestedAt,
    receipt: inv.receipt ? { contentType: inv.receipt.contentType, uploadedAt: inv.receipt.uploadedAt } : undefined,
    // To'lov ma'lumoti faqat kutilayotganda: kabinetdagi blok shundan chiziladi
    payment:
      inv.review === 'pending' && inv.status !== 'published'
        ? { card: formattedCard(), holder: PAYMENT_HOLDER || undefined, price: PAYMENT_PRICE }
        : undefined,
    // Tasdiq kechiksa foydalanuvchi shu botga yozadi (t.me/<bot>?start=<id>)
    supportBot: process.env.TG_BOT_USERNAME || undefined,
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
    const { status, ...rest } = data;
    const inv = new Invitation({ ...rest, owner: req.userId, status: 'draft' });
    const notify = await handlePublish(req, inv, status === 'published');
    await inv.save();
    // O'z musiqasi bo'lsa — kutubxonaga nomzod (admin tasdiqlasa hammaga ko'rinadi)
    rememberUploadedMusic(inv).catch((err) => console.warn('Music library:', (err as Error).message));
    if (notify) void notifyApprovalNeeded(inv);
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
    if (data.template && data.template !== inv.template && HIDDEN_TEMPLATE_KEYS.includes(data.template)) {
      res.status(422).json({ error: "Bu shablon yangi taklifnomalar uchun yopilgan", field: 'template' });
      return;
    }
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
    const { status, ...rest } = data;
    inv.set(rest);
    if (status === 'draft') inv.status = 'draft';
    const notify = await handlePublish(req, inv, status === 'published');
    await inv.save();
    // O'z musiqasi bo'lsa — kutubxonaga nomzod (admin tasdiqlasa hammaga ko'rinadi)
    rememberUploadedMusic(inv).catch((err) => console.warn('Music library:', (err as Error).message));
    if (notify) void notifyApprovalNeeded(inv);
    const stats = await statsFor([inv._id]);
    res.json(ownerView(inv, stats.get(String(inv._id))));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/invitations/:id/receipt — egasi to'lov chekini saytdan yuklaydi.
 * Chek admin'ga Telegram orqali tasdiqlash tugmalari bilan ham boradi; u yerga
 * yetmasa ham saqlangan bo'ladi va admin panelda ko'rinadi.
 */
export async function uploadReceipt(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const inv = await findOwned(req, res);
    if (!inv) return;
    if (inv.review !== 'pending' || inv.status === 'published') {
      res.status(409).json({ error: "Bu taklifnoma uchun to'lov kutilmayapti" });
      return;
    }
    const type = req.file ? sniffReceipt(req.file.buffer) : null;
    if (!req.file || !type) {
      res.status(422).json({ error: 'Chek JPG, PNG, WEBP rasm yoki PDF bo\'lishi kerak (5 MB gacha)' });
      return;
    }
    const filename = `${inv.slug}-${crypto.randomUUID()}.${type.ext}`;
    await storeReceipt(filename, req.file.buffer, type.contentType);
    const previous = inv.receipt?.filename;
    inv.receipt = { filename, contentType: type.contentType, size: req.file.size, uploadedAt: new Date() };
    await inv.save();
    await deleteReceiptFile(previous);

    if (telegramEnabled()) {
      const data = req.file.buffer;
      void sendDocument(ADMIN_CHAT_ID, data, filename, type.contentType, `🧾 ${inv.groomName} & ${inv.brideName} — to'lov cheki`)
        .then(() => notifyApprovalNeeded(inv, 'receipt'))
        .catch((err) => console.error('Receipt notification failed:', (err as Error).message));
    }
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
