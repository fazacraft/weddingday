import { Schema, model, Document, Types } from 'mongoose';

export interface IWish extends Document {
  invitation: Types.ObjectId;
  name: string;
  message: string;
  /** Admin yashirgan tilak mehmonlarga ko'rinmaydi (so'kinish va h.k.) */
  hidden: boolean;
  createdAt: Date;
}

const wishSchema = new Schema<IWish>(
  {
    invitation: {
      type: Schema.Types.ObjectId,
      ref: 'Invitation',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Admin paneldagi umumiy ro'yxat yangilari birinchi tartiblanadi
wishSchema.index({ createdAt: -1 });

export const Wish = model<IWish>('Wish', wishSchema);
