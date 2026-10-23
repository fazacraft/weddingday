import { Schema, model, Document, Types } from 'mongoose';

/**
 * Musiqa kutubxonasidagi foydalanuvchi yuklagan qo'shiq. Taklifnoma o'z
 * musiqasi bilan saqlanganda "pending" bo'lib tushadi; admin tasdiqlasa
 * ("approved") wizard'dagi umumiy ro'yxatda hammaga ko'rinadi. Platformaning
 * o'z musiqalari frontend'da (lib/music.ts) — bu yerda faqat yuklanganlari.
 */
export const TRACK_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type TrackStatus = (typeof TRACK_STATUSES)[number];

export interface ITrack extends Document {
  /** /uploads/<uuid>.mp3 — fayl GridFS'da */
  url: string;
  title: string;
  artist: string;
  durationSec: number;
  status: TrackStatus;
  submittedBy?: Types.ObjectId;
  invitation?: Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    url: { type: String, required: true, unique: true },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    artist: { type: String, default: '', trim: true, maxlength: 120 },
    durationSec: { type: Number, default: 0 },
    status: { type: String, enum: TRACK_STATUSES, default: 'pending', index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    invitation: { type: Schema.Types.ObjectId, ref: 'Invitation' },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

export const Track = model<ITrack>('Track', trackSchema);
