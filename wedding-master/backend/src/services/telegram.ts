/**
 * Admin'ga Telegram orqali nashr tasdig'ini so'rash. Sozlama (env):
 *   TG_BOT_TOKEN, TG_ADMIN_CHAT_ID — bot va admin chati
 *   TG_WEBHOOK_SECRET — Telegram webhook so'rovlarini tekshirish uchun
 *   PUBLIC_URL — havolalar uchun sayt manzili (masalan https://beluga.uz)
 * Sozlanmagan bo'lsa, tasdiqlash faqat /admin panelida qilinadi.
 */
const TOKEN = process.env.TG_BOT_TOKEN ?? '';
/** Sinov uchun almashtirish mumkin (lokal soxta Telegram server) */
const API_BASE = (process.env.TG_API_BASE ?? 'https://api.telegram.org').replace(/\/+$/, '');
export const ADMIN_CHAT_ID = process.env.TG_ADMIN_CHAT_ID ?? '';
const PUBLIC_URL = (process.env.PUBLIC_URL ?? '').replace(/\/+$/, '');

/** To'lov: karta raqami botda ko'rsatiladi, chek botga yoki shu kontaktga yuboriladi. */
export const PAYMENT_CARD = (process.env.PAYMENT_CARD ?? '9860160141174617').replace(/\s/g, '');
export const PAYMENT_CONTACT = (process.env.PAYMENT_CONTACT ?? 'belugadotenv').replace(/^@/, '');

/** "9860160141174617" → "9860 1601 4117 4617" */
export function formattedCard(): string {
  return PAYMENT_CARD.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function telegramEnabled(): boolean {
  return Boolean(TOKEN && ADMIN_CHAT_ID);
}

async function call(method: string, body: Record<string, unknown>): Promise<void> {
  if (!TOKEN) return;
  try {
    const res = await fetch(`${API_BASE}/bot${TOKEN}/${method}`, {
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

export function approvalText(info: ApprovalInfo, withHeader = true): string {
  const [y, m, d] = info.date.split('-');
  return [
    ...(withHeader ? ['🆕 <b>Yangi taklifnoma — to\'lov va tasdiq kutilmoqda</b>', ''] : []),
    `💍 <b>${escapeHtml(info.groomName)} &amp; ${escapeHtml(info.brideName)}</b> — ${escapeHtml(info.eventTitle)}`,
    `📅 ${d}.${m}.${y}, ${escapeHtml(info.time)} · ${escapeHtml(info.venueName)}`,
    `🔗 ${escapeHtml(PUBLIC_URL ? `${PUBLIC_URL}/${info.slug}` : `/${info.slug}`)}`,
    `🎨 Shablon: ${escapeHtml(info.template)}`,
    `👤 ${escapeHtml(info.ownerName)} (${escapeHtml(info.ownerEmail)})`,
  ].join('\n');
}

export function publicLink(slug: string): string {
  return PUBLIC_URL ? `${PUBLIC_URL}/${slug}` : `/${slug}`;
}

export async function sendToChat(chatId: number | string, html: string): Promise<void> {
  await call('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true });
}

export async function forwardToAdmin(fromChatId: number, messageId: number): Promise<void> {
  if (!ADMIN_CHAT_ID) return;
  await call('forwardMessage', { chat_id: ADMIN_CHAT_ID, from_chat_id: fromChatId, message_id: messageId });
}

export type ApprovalKind = 'new' | 'reminder' | 'receipt';

const APPROVAL_HEADERS: Record<Exclude<ApprovalKind, 'new'>, string> = {
  reminder: '⏰ <b>Foydalanuvchi botga kirdi — to\'lov kutilmoqda</b>',
  receipt: '🧾 <b>To\'lov cheki keldi (yuqoridagi xabar)</b>',
};

export async function sendApprovalRequest(info: ApprovalInfo, kind: ApprovalKind = 'new'): Promise<void> {
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
    text: kind === 'new' ? approvalText(info) : `${APPROVAL_HEADERS[kind]}\n\n${approvalText(info, false)}`,
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
