import { Schema, model, Document, Types } from 'mongoose';

export const TEMPLATE_KEYS = ['bog', 'anor', 'atirgul'] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

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
  musicUrl: string;

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
    musicUrl: { type: String, default: '' },

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

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
