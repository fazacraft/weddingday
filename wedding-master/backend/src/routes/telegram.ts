import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { Invitation } from '../models/Invitation';
import { decideReview, notifyApprovalNeeded } from '../services/review';
import {
  ADMIN_CHAT_ID,
  answerCallback,
  escapeHtml,
  finishApprovalMessage,
  forwardToAdmin,
  sendToChat,
} from '../services/telegram';

const router = Router();

interface TgUpdate {
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number; text?: string };
  };
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number };
    text?: string;
  };
}

/** Admin tasdiqlash/rad etish tugmasini bosdi. */
async function handleCallback(cb: NonNullable<TgUpdate['callback_query']>): Promise<void> {
  if (!cb.data) return;
  if (String(cb.from.id) !== ADMIN_CHAT_ID) {
    await answerCallback(cb.id, 'Faqat admin tasdiqlay oladi');
    return;
  }
  const [action, id] = cb.data.split(':');
  if ((action !== 'approve' && action !== 'reject') || !id) return;

  const inv = await decideReview(id, action);
  if (!inv) {
    await answerCallback(cb.id, "Taklifnoma topilmadi (o'chirilgan bo'lishi mumkin)");
    return;
  }
  const verdict = action === 'approve' ? '✅ Tasdiqlandi — havola ishlayapti' : '❌ Rad etildi';
  await answerCallback(cb.id, verdict);
  if (cb.message) {
    const original = escapeHtml(cb.message.text ?? '');
    await finishApprovalMessage(cb.message.chat.id, cb.message.message_id, `${original}\n\n<b>${verdict}</b>`);
  }
}

/**
 * Foydalanuvchi botga yozdi. Saytdagi tugma "/start <taklifnoma id>" yuboradi —
 * shunda admin'ga eslatma qayta ketadi va qaror shu chatga yuboriladi.
 * Boshqa xabarlar admin'ga forward qilinadi.
 */
async function handleMessage(msg: NonNullable<TgUpdate['message']>): Promise<void> {
  if (msg.chat.type !== 'private' || String(msg.chat.id) === ADMIN_CHAT_ID) return;
  const text = (msg.text ?? '').trim();
  const startArg = /^\/start(?:\s+(\S+))?$/.exec(text)?.[1];

  if (startArg && isValidObjectId(startArg)) {
    const inv = await Invitation.findById(startArg);
    if (!inv) {
      await sendToChat(msg.chat.id, "Bu taklifnoma topilmadi. Saytdagi kabinetingizni tekshiring.");
      return;
    }
    inv.ownerTgChatId = msg.chat.id;
    await inv.save();
    const names = `${escapeHtml(inv.groomName)} &amp; ${escapeHtml(inv.brideName)}`;
    if (inv.review === 'pending') {
      await notifyApprovalNeeded(inv, true);
      await sendToChat(
        msg.chat.id,
        `Assalomu alaykum! <b>${names}</b> taklifnomangiz bo'yicha so'rovingiz adminga qayta yuborildi.\n\nTasdiqlanishi bilan havolani shu yerga yuboraman. Savolingiz bo'lsa, shu yerga yozing.`
      );
    } else if (inv.review === 'approved' || inv.status === 'published') {
      await sendToChat(msg.chat.id, `<b>${names}</b> taklifnomasi allaqachon tasdiqlangan ✅ Havolani kabinetingizdan oling.`);
    } else {
      await sendToChat(msg.chat.id, `<b>${names}</b> taklifnomasi hali tasdiqlashga yuborilmagan. Kabinetda "Tasdiqlashga yuborish" tugmasini bosing.`);
    }
    return;
  }

  if (text === '/start') {
    await sendToChat(
      msg.chat.id,
      "Assalomu alaykum! Bu Beluga taklifnomalari boti.\n\nTaklifnomangiz tasdig'i bo'yicha yozmoqchi bo'lsangiz, saytdagi kabinetingizda <b>«Botga yozish»</b> tugmasini bosing yoki savolingizni shu yerga yozing."
    );
    return;
  }

  await forwardToAdmin(msg.chat.id, msg.message_id);
  await sendToChat(msg.chat.id, 'Xabaringiz adminga yetkazildi ✅');
}

/**
 * Telegram webhook. setWebhook'da berilgan secret_token sarlavhada qaytadi;
 * mos kelmasa so'rov rad etiladi.
 */
router.post('/webhook', async (req, res) => {
  const secret = process.env.TG_WEBHOOK_SECRET;
  if (!secret || req.get('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    res.status(403).end();
    return;
  }
  // Telegram javobni kutmasin (aks holda qayta yuboradi) — ishni fonda bajaramiz
  res.json({ ok: true });

  const update = req.body as TgUpdate;
  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message) await handleMessage(update.message);
  } catch (err) {
    console.error('Telegram webhook error', err);
  }
});

export default router;
