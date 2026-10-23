import { TgRelay } from '../models/TgRelay';

/** Admin chatidagi xabarni foydalanuvchi chati bilan bog'laydi (reply qilinganda javob shu yerga boradi). */
export async function rememberRelay(adminMessageId: number | null, userChatId: number | null | undefined): Promise<void> {
  if (!adminMessageId || !userChatId) return;
  await TgRelay.updateOne({ adminMessageId }, { $set: { userChatId } }, { upsert: true });
}

/** Admin reply qilgan xabar (Bot API'dagi reply_to_message) — kerakli maydonlar. */
export interface RepliedMessage {
  message_id: number;
  forward_origin?: { type: string; sender_user?: { id: number; is_bot?: boolean } };
  /** Eski Bot API maydoni */
  forward_from?: { id: number; is_bot?: boolean };
}

/**
 * Javob kimga borishi kerak: avval saqlangan bog'lanish, bo'lmasa (bu funksiya
 * qo'shilishidan oldingi forward'lar) Telegram'ning "forwarded from" ma'lumoti.
 */
export async function relayTarget(replied: RepliedMessage): Promise<number | null> {
  const saved = await TgRelay.findOne({ adminMessageId: replied.message_id }).lean();
  if (saved) return saved.userChatId;
  const user = replied.forward_origin?.type === 'user' ? replied.forward_origin.sender_user : replied.forward_from;
  return user && !user.is_bot ? user.id : null;
}
