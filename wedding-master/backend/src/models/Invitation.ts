import { Schema, model, Document, Types } from 'mongoose';
import { invalidatePublic } from '../services/publicCache';

export const TEMPLATE_KEYS = ['bog', 'anor', 'atirgul', 'kuz', 'osmon'] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/**
 * Yangi taklifnomalar uchun yopilgan shablonlar (frontend registry'dagi `hidden`).
 * Bu shablondagi mavjud taklifnomalar ishlayveradi va tahrirlanadi, lekin boshqa
 * taklifnomani bu shablonga o'tkazib yoki yangisini yaratib bo'lmaydi.
 */
export const HIDDEN_TEMPLATE_KEYS: readonly TemplateKey[] = ['kuz'];
export const SELECTABLE_TEMPLATE_KEYS = TEMPLATE_KEYS.filter((key) => !HIDDEN_TEMPLATE_KEYS.includes(key));

/** Galereyadagi rasmlar soni chegarasi (frontend'dagi GALLERY_MAX bilan bir xil). */
export const GALLERY_MAX = 6;

/** Taklifnomaga yuklangan barcha media fayllar (o'chirishda tozalash uchun). */
export function invitationMedia(inv: Pick<IInvitation, 'couplePhoto' | 'coverPhoto' | 'venuePhoto' | 'gallery' | 'musicUrl'>): string[] {
  return [inv.couplePhoto, inv.coverPhoto, inv.venuePhoto, ...(inv.gallery ?? []), inv.musicUrl].filter(Boolean);
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/;

/** Frontend marshrutlari bilan to'qnashmasligi uchun band qilingan manzillar. */
export const RESERVED_SLUGS = new Set([
  'api', 'uploads', 'assets', 'templates', 'shablonlar', 'create', 'yaratish',
  'login', 'register', 'kirish', 'royxatdan-otish', 'dashboard', 'kabinet',
  'preview', 'korinish', 'tahrirlash', 'admin',
  'socket-io', 'static', 'about', 'help', 'yordam', 'narxlar', 'pricing',
]);

/**
 * Nashr qilish uchun admin tasdig'i (Telegram yoki /admin orqali):
 * none — hali so'ralmagan, pending — kutilmoqda, approved — ruxsat berilgan
 * (keyin egasi o'zi nashrga qo'yib/olib turishi mumkin), rejected — rad etilgan.
 */
export const REVIEW_STATES = ['none', 'pending', 'approved', 'rejected'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export interface ScheduleItem {
  time: string;
  title: string;
}

export interface InvitationFeatures {
  wishes: boolean;
  rsvp: boolean;
  gift: boolean;
}

export interface IInvitation extends Document {
  owner: Types.ObjectId;
  slug: string;
  template: TemplateKey;
  status: 'draft' | 'published';
  review: ReviewState;
  /** Oxirgi marta tasdiqlashga yuborilgan vaqt (5 daqiqalik eslatma uchun) */
  reviewRequestedAt?: Date;
  /** Egasi botga yozgan bo'lsa — qaror shu chatga yuboriladi */
  ownerTgChatId?: number;

  groomName: string;
  brideName: string;
  date: string;
  time: string;
  eventTitle: string;
  inviteText: string;
  greetingHeading: string;
  greetingMessage: string;

  venueName: string;
  venueAddress: string;
  venueLandmark: string;
  googleMapUrl: string;
  yandexMapUrl: string;

  schedule: ScheduleItem[];
  couplePhoto: string;
  coverPhoto: string;
  venuePhoto: string;
  gallery: string[];
  musicUrl: string;
  /** Foydalanuvchi yuklagan qo'shiqning nomi (musiqa kutubxonasiga taklif uchun) */
  musicTitle: string;

  cardNumber: string;
  cardHolder: string;
  dressCode: string;

  features: InvitationFeatures;
  openCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    template: { type: String, enum: TEMPLATE_KEYS, default: 'bog' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    review: { type: String, enum: REVIEW_STATES, default: 'none' },
    reviewRequestedAt: { type: Date },
    ownerTgChatId: { type: Number },

    groomName: { type: String, required: true, trim: true },
    brideName: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    eventTitle: { type: String, default: "Nikoh to'yi", trim: true },
    inviteText: { type: String, default: '', trim: true },
    greetingHeading: { type: String, default: '', trim: true },
    greetingMessage: { type: String, default: '' },

    venueName: { type: String, required: true, trim: true },
    venueAddress: { type: String, default: '', trim: true },
    venueLandmark: { type: String, default: '', trim: true },
    googleMapUrl: { type: String, default: '', trim: true },
    yandexMapUrl: { type: String, default: '', trim: true },

    schedule: {
      type: [{ time: String, title: String, _id: false }],
      default: [],
    },
    couplePhoto: { type: String, default: '' },
    coverPhoto: { type: String, default: '' },
    venuePhoto: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    musicUrl: { type: String, default: '' },
    musicTitle: { type: String, default: '', trim: true, maxlength: 120 },

    cardNumber: { type: String, default: '', trim: true },
    cardHolder: { type: String, default: '', trim: true },
    dressCode: { type: String, default: '', trim: true },

    features: {
      wishes: { type: Boolean, default: true },
      rsvp: { type: Boolean, default: true },
      gift: { type: Boolean, default: false },
    },
    openCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/** Mehmonlarga ochiq ko'rinadigan maydonlar (egasi va ichki hisoblagichlarsiz). */
export function publicInvitation(inv: IInvitation) {
  return {
    id: String(inv._id),
    slug: inv.slug,
    template: inv.template,
    status: inv.status,
    groomName: inv.groomName,
    brideName: inv.brideName,
    date: inv.date,
    time: inv.time,
    eventTitle: inv.eventTitle,
    inviteText: inv.inviteText,
    greetingHeading: inv.greetingHeading,
    greetingMessage: inv.greetingMessage,
    venueName: inv.venueName,
    venueAddress: inv.venueAddress,
    venueLandmark: inv.venueLandmark,
    googleMapUrl: inv.googleMapUrl,
    yandexMapUrl: inv.yandexMapUrl,
    schedule: inv.schedule.map(({ time, title }) => ({ time, title })),
    couplePhoto: inv.couplePhoto,
    coverPhoto: inv.coverPhoto,
    venuePhoto: inv.venuePhoto,
    gallery: [...inv.gallery],
    musicUrl: inv.musicUrl,
    cardNumber: inv.features.gift ? inv.cardNumber : '',
    cardHolder: inv.features.gift ? inv.cardHolder : '',
    dressCode: inv.dressCode,
    features: {
      wishes: inv.features.wishes,
      rsvp: inv.features.rsvp,
      gift: inv.features.gift,
    },
  };
}

/*
 * Ommaviy sahifa keshini (services/publicCache) har qanday o'zgarishda tozalaymiz —
 * wizard, admin, Telegram tasdig'i qaysi yo'l bilan saqlamasin. Manzil (slug)
 * o'zgarsa, eskisi ham tozalanadi: u endi 404 bo'lishi kerak.
 */
invitationSchema.post('init', function (doc) {
  doc.$locals.loadedSlug = doc.slug;
});
invitationSchema.post('save', function (doc) {
  invalidatePublic(doc.slug, doc.$locals.loadedSlug as string | undefined);
  doc.$locals.loadedSlug = doc.slug;
});
invitationSchema.post('deleteOne', { document: true, query: false }, function (doc) {
  invalidatePublic(doc.slug, doc.$locals.loadedSlug as string | undefined);
});
invitationSchema.post('findOneAndUpdate', function (doc: IInvitation | null) {
  if (doc) invalidatePublic(doc.slug);
});

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
