import { Schema, model } from 'mongoose';

/**
 * Admin chatidagi xabar → qaysi foydalanuvchi chatiga tegishli. Admin shu
 * xabarga reply qilsa, bot javobni o'sha foydalanuvchiga yetkazadi.
 * Telegram'ning "forwarded from" ma'lumotiga tayanmaymiz: foydalanuvchi uni
 * maxfiylik sozlamasida yashirgan bo'lsa, u bo'sh keladi.
 */
interface ITgRelay {
  adminMessageId: number;
  userChatId: number;
  createdAt: Date;
}

const tgRelaySchema = new Schema<ITgRelay>({
  adminMessageId: { type: Number, required: true, unique: true },
  userChatId: { type: Number, required: true },
  // Eski yozishmalar o'z-o'zidan tozalanadi
  createdAt: { type: Date, default: Date.now, expires: '180d' },
});

export const TgRelay = model<ITgRelay>('TgRelay', tgRelaySchema);
