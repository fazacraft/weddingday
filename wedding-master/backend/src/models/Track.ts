import { Schema, model, Document, Types } from 'mongoose';

/**
 * Musiqa kutubxonasi. "active" — wizard'dagi umumiy ro'yxatda hammaga ko'rinadi;
 * "inactive" — ko'rinmaydi, lekin uni tanlab bo'lgan taklifnomada chalinaveradi.
 * Foydalanuvchi o'z musiqasini yuklasa, inactive bo'lib tushadi. Saytga o'rnatilgan
 * musiqalar (builtInKey) ham shu yerda: server ishga tushganda qo'shiladi.
 */
export const TRACK_STATUSES = ['active', 'inactive'] as const;
export type TrackStatus = (typeof TRACK_STATUSES)[number];

export interface ITrack extends Document {
  /** Hozir chalinadigan fayl: /uploads/<uuid>.mp3 (GridFS) yoki saytdagi /templates/... */
  url: string;
  /** Qirqilmagan asl fayl — A:B doim shunga nisbatan, qayta qirqish sifatni yo'qotmaydi */
  sourceUrl?: string;
  /** Asl fayldagi tanlangan oraliq (soniya); bo'sh — butun fayl */
  trimStart?: number;
  trimEnd?: number;
  title: string;
  artist: string;
  durationSec: number;
  status: TrackStatus;
  /** Saytga o'rnatilgan musiqa kaliti (o'chirib bo'lmaydi) */
  builtInKey?: string;
  submittedBy?: Types.ObjectId;
  invitation?: Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    url: { type: String, required: true, unique: true },
    sourceUrl: { type: String },
    trimStart: { type: Number },
    trimEnd: { type: Number },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    artist: { type: String, default: '', trim: true, maxlength: 120 },
    durationSec: { type: Number, default: 0 },
    status: { type: String, enum: TRACK_STATUSES, default: 'inactive', index: true },
    builtInKey: { type: String, unique: true, sparse: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    invitation: { type: Schema.Types.ObjectId, ref: 'Invitation' },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

export const Track = model<ITrack>('Track', trackSchema);
