import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  /** Google orqali ochilgan hisobda bo'lmaydi */
  passwordHash?: string;
  /** Google hisobi (sub) — bog'langan bo'lsa */
  googleId?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/** ADMIN_EMAILS=a@x.uz,b@y.uz — shu email'lar /admin paneliga kira oladi. */
export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export function publicUser(user: IUser) {
  return { id: String(user._id), name: user.name, email: user.email, isAdmin: isAdminEmail(user.email) };
}

export const User = model<IUser>('User', userSchema);
