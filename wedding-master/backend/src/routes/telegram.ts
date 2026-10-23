import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { Invitation } from '../models/Invitation';
import { decideReview, notifyApprovalNeeded } from '../services/review';
import {
  ADMIN_CHAT_ID,
  PAYMENT_CONTACT,
  answerCallback,
  copyMessage,
  formattedCard,
  escapeHtml,
  finishApprovalMessage,
  forwardToAdmin,
  sendToChat,
} from '../services/telegram';
import { relayTarget, rememberRelay, type RepliedMessage } from '../services/telegramRelay';

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
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
    caption?: string;
    photo?: unknown[];
    document?: { mime_type?: string };
    reply_to_message?: RepliedMessage;
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

function paymentText(names: string): string {
  return [
    `💳 <b>${names}</b> taklifnomasini faollashtirish uchun to'lov qiling.`,
    '',
    `Karta raqami: <code>${formattedCard()}</code>`,
    '<i>(raqamni bosib nusxalash mumkin)</i>',
    '',
    `To'lovdan so'ng <b>chekni (skrinshot) shu yerga</b> yoki @${PAYMENT_CONTACT} ga yuboring — <b>bu majburiy</b>.`,
    "Chek tekshirilgach taklifnomangiz faollashtiriladi va havolani shu yerga yuboraman.",
  ].join('\n');
}

/**
 * Foydalanuvchi botga yozdi.
 * - "/start <taklifnoma id>" (saytdagi tugma) — chat taklifnomaga bog'lanadi,
 *   karta raqami va yo'riqnoma yuboriladi, admin'ga eslatma ketadi.
 * - Rasm/fayl (to'lov cheki) — admin'ga forward qilinadi va ostidan shu chatga
 *   bog'langan taklifnomalar uchun ✅/❌ tugmalari keladi.
 * - Boshqa matn — admin'ga forward qilinadi.
 */
async function handleMessage(msg: NonNullable<TgUpdate['message']>): Promise<void> {
  if (msg.chat.type !== 'private') return;
  if (String(msg.chat.id) === ADMIN_CHAT_ID) {
    await handleAdminReply(msg);
    return;
  }
  const text = (msg.text ?? '').trim();
  const startArg = /^\/start(?:\s+(\S+))?$/.exec(text)?.[1];

  if (startArg && isValidObjectId(startArg)) {
    const inv = await Invitation.findById(startArg);
    if (!inv) {
      await sendToChat(msg.chat.id, 'Bu taklifnoma topilmadi. Saytdagi kabinetingizni tekshiring.');
      return;
    }
    inv.ownerTgChatId = msg.chat.id;
    await inv.save();
    const names = `${escapeHtml(inv.groomName)} &amp; ${escapeHtml(inv.brideName)}`;
    if (inv.review === 'approved' || inv.status === 'published') {
      await sendToChat(msg.chat.id, `<b>${names}</b> taklifnomasi allaqachon faol ✅ Havolani kabinetingizdan oling.`);
    } else if (inv.review === 'pending') {
      await sendToChat(msg.chat.id, paymentText(names));
      await notifyApprovalNeeded(inv, 'reminder');
    } else {
      await sendToChat(
        msg.chat.id,
        `<b>${names}</b> taklifnomasi hali faollashtirishga yuborilmagan. Kabinetda "Faollashtirish" tugmasini bosing.`
      );
    }
    return;
  }

  if (text === '/start') {
    await sendToChat(
      msg.chat.id,
      [
        `Assalomu alaykum! Bu Beluga taklifnomalari boti.`,
        '',
        `Taklifnomani faollashtirish uchun to'lov kartasi: <code>${formattedCard()}</code>`,
        `To'lovdan so'ng chekni shu yerga yoki @${PAYMENT_CONTACT} ga yuboring — bu majburiy.`,
        '',
        "Chekni taklifnomangizga bog'lash uchun saytdagi kabinetingizda <b>«Telegram botni ochish»</b> tugmasini bosing.",
      ].join('\n')
    );
    return;
  }

  // Admin shu forward'ga reply qilsa, javob shu foydalanuvchiga qaytadi
  await rememberRelay(await forwardToAdmin(msg.chat.id, msg.message_id), msg.chat.id);

  const isReceipt = Boolean(msg.photo || msg.document);
  if (!isReceipt) {
    await sendToChat(msg.chat.id, '✅ Xabaringiz yuborildi. Admin javobi shu yerga keladi.');
    return;
  }

  // Chek: shu chatga bog'langan, to'lov kutayotgan taklifnomalar uchun tasdiqlash tugmalari
  const pending = await Invitation.find({ ownerTgChatId: msg.chat.id, review: 'pending', status: { $ne: 'published' } });
  if (pending.length === 0) {
    const who = msg.from?.username ? `@${escapeHtml(msg.from.username)}` : escapeHtml(msg.from?.first_name ?? 'foydalanuvchi');
    await sendToChat(
      ADMIN_CHAT_ID,
      `🧾 Yuqoridagi chek ${who} dan. U taklifnomasini botga bog'lamagan — /admin paneldan qo'lda tasdiqlang.`
    );
    await sendToChat(
      msg.chat.id,
      "✅ Chek qabul qilindi va adminga yuborildi.\n\nTezroq tasdiqlanishi uchun saytdagi kabinetingizda <b>«Telegram botni ochish»</b> tugmasini bosing — shunda chek taklifnomangizga bog'lanadi."
    );
    return;
  }
  for (const inv of pending) await notifyApprovalNeeded(inv, 'receipt');
  await sendToChat(
    msg.chat.id,
    "✅ Chek qabul qilindi! Tekshirilgach taklifnomangiz faollashtiriladi va havolani shu yerga yuboraman."
  );
}

/**
 * Admin botga yozdi. Foydalanuvchi xabariga (forward) yoki taklifnoma
 * xabariga reply qilgan bo'lsa — javob o'sha foydalanuvchiga yetkaziladi
 * (matn ham, rasm/ovoz/stiker ham). Natija admin'ga reply bilan bildiriladi.
 */
async function handleAdminReply(msg: NonNullable<TgUpdate['message']>): Promise<void> {
  const replied = msg.reply_to_message;
  if (!replied) {
    // Buyruqlar (/start va h.k.) — jim; oddiy matnga qanday javob berishni eslatamiz
    if (!(msg.text ?? '').startsWith('/')) {
      await sendToChat(msg.chat.id, "ℹ️ Foydalanuvchiga javob berish uchun uning xabariga <b>Reply</b> qiling.", msg.message_id);
    }
    return;
  }
  const target = await relayTarget(replied);
  if (!target) {
    await sendToChat(
      msg.chat.id,
      "❌ Kimga yuborishni aniqlab bo'lmadi: bu foydalanuvchi xabari emas, egasi botga hali yozmagan yoki u profilini yashirgan.",
      msg.message_id
    );
    return;
  }
  const header = '💬 <b>Admin javobi:</b>';
  const delivered = msg.text
    ? await sendToChat(target, `${header}\n\n${escapeHtml(msg.text)}`)
    : (await sendToChat(target, header)) && (await copyMessage(target, msg.chat.id, msg.message_id));
  await sendToChat(
    msg.chat.id,
    delivered ? '✅ Yetkazildi' : "❌ Yetkazilmadi — foydalanuvchi botni bloklagan bo'lishi mumkin.",
    msg.message_id
  );
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
