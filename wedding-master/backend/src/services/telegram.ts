/**
 * Admin'ga Telegram orqali nashr tasdig'ini so'rash. Sozlama (env):
 *   TG_BOT_TOKEN, TG_ADMIN_CHAT_ID — bot va admin chati
 *   TG_WEBHOOK_SECRET — Telegram webhook so'rovlarini tekshirish uchun
 *   PUBLIC_URL — havolalar uchun sayt manzili (masalan https://beluga.uz)
 * Sozlanmagan bo'lsa, tasdiqlash faqat /admin panelida qilinadi.
 */
const TOKEN = process.env.TG_BOT_TOKEN ?? '';
export const ADMIN_CHAT_ID = process.env.TG_ADMIN_CHAT_ID ?? '';
const PUBLIC_URL = (process.env.PUBLIC_URL ?? '').replace(/\/+$/, '');

export function telegramEnabled(): boolean {
  return Boolean(TOKEN && ADMIN_CHAT_ID);
}

async function call(method: string, body: Record<string, unknown>): Promise<void> {
  if (!TOKEN) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error(`Telegram ${method} failed: ${res.status} ${await res.text()}`);
  } catch (err) {
    // Telegram ishlamasa ham sayt ishlashda davom etadi — admin /admin'dan tasdiqlaydi
    console.error(`Telegram ${method} error`, err);
  }
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface ApprovalInfo {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
  eventTitle: string;
  date: string;
  time: string;
  venueName: string;
  template: string;
  ownerName: string;
  ownerEmail: string;
}

export function approvalText(info: ApprovalInfo): string {
  const [y, m, d] = info.date.split('-');
  return [
    '🆕 <b>Yangi taklifnoma tasdiqlashni kutyapti</b>',
    '',
    `💍 <b>${escapeHtml(info.groomName)} &amp; ${escapeHtml(info.brideName)}</b> — ${escapeHtml(info.eventTitle)}`,
    `📅 ${d}.${m}.${y}, ${escapeHtml(info.time)} · ${escapeHtml(info.venueName)}`,
    `🔗 ${escapeHtml(PUBLIC_URL ? `${PUBLIC_URL}/${info.slug}` : `/${info.slug}`)}`,
    `🎨 Shablon: ${escapeHtml(info.template)}`,
    `👤 ${escapeHtml(info.ownerName)} (${escapeHtml(info.ownerEmail)})`,
  ].join('\n');
}

export async function sendApprovalRequest(info: ApprovalInfo): Promise<void> {
  if (!telegramEnabled()) return;
  const keyboard: { text: string; callback_data?: string; url?: string }[][] = [
    [
      { text: '✅ Tasdiqlash', callback_data: `approve:${info.id}` },
      { text: '❌ Rad etish', callback_data: `reject:${info.id}` },
    ],
  ];
  // Qoralamani admin brauzerida (saytga admin sifatida kirgan bo'lsa) ko'rish mumkin
  if (PUBLIC_URL.startsWith('https://')) {
    keyboard.push([{ text: "👁 Ko'rish", url: `${PUBLIC_URL}/${info.slug}` }]);
  }
  await call('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: approvalText(info),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard },
  });
}

export async function answerCallback(callbackId: string, text: string): Promise<void> {
  await call('answerCallbackQuery', { callback_query_id: callbackId, text });
}

/** Tasdiqlash xabarini natija bilan almashtiradi va tugmalarni olib tashlaydi. */
export async function finishApprovalMessage(chatId: number, messageId: number, html: string): Promise<void> {
  await call('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}
