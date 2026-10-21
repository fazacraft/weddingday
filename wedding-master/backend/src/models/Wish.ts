import { Schema, model, Document, Types } from 'mongoose';

export interface IWish extends Document {
  invitation: Types.ObjectId;
  name: string;
  message: string;
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Wish = model<IWish>('Wish', wishSchema);
