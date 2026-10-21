import { Schema, model, Document, Types } from 'mongoose';

export interface IRsvp extends Document {
  invitation: Types.ObjectId;
  name: string;
  attending: boolean;
  guests: number;
  createdAt: Date;
}

const rsvpSchema = new Schema<IRsvp>(
  {
    invitation: {
      type: Schema.Types.ObjectId,
      ref: 'Invitation',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    attending: { type: Boolean, required: true },
    guests: { type: Number, default: 1, min: 1, max: 20 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Rsvp = model<IRsvp>('Rsvp', rsvpSchema);
