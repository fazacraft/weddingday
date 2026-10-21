import { Router } from 'express';
import { decideReview } from '../services/review';
import {
  ADMIN_CHAT_ID,
  answerCallback,
  escapeHtml,
  finishApprovalMessage,
} from '../services/telegram';

const router = Router();

interface CallbackUpdate {
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number; text?: string };
  };
}

/**
 * Telegram webhook — admin tasdiqlash tugmalarini bosganda keladi.
 * setWebhook'da berilgan secret_token sarlavhada qaytadi; mos kelmasa rad etiladi.
 */
router.post('/webhook', async (req, res) => {
  const secret = process.env.TG_WEBHOOK_SECRET;
  if (!secret || req.get('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    res.status(403).end();
    return;
  }
  // Telegram javobni kutmasin (aks holda qayta yuboradi) — ishni fonda bajaramiz
  res.json({ ok: true });

  const cb = (req.body as CallbackUpdate).callback_query;
  if (!cb?.data) return;
  try {
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
  } catch (err) {
    console.error('Telegram webhook error', err);
  }
});

export default router;
