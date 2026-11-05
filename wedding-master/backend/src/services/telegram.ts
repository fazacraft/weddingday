/**
 * Admin'ga Telegram orqali nashr tasdig'ini so'rash. Sozlama (env):
 *   TG_BOT_TOKEN, TG_ADMIN_CHAT_ID — bot va admin chati
 *   TG_WEBHOOK_SECRET — Telegram webhook so'rovlarini tekshirish uchun
 *   PUBLIC_URL — havolalar uchun sayt manzili (masalan https://beluga.uz)
 * Sozlanmagan bo'lsa, tasdiqlash faqat /admin panelida qilinadi.
 */
import { previewKey } from './previewKey';

const TOKEN = process.env.TG_BOT_TOKEN ?? '';
/** Sinov uchun almashtirish mumkin (lokal soxta Telegram server) */
const API_BASE = (process.env.TG_API_BASE ?? 'https://api.telegram.org').replace(/\/+$/, '');
export const ADMIN_CHAT_ID = process.env.TG_ADMIN_CHAT_ID ?? '';
const PUBLIC_URL = (process.env.PUBLIC_URL ?? '').replace(/\/+$/, '');

/** To'lov: karta raqami botda ko'rsatiladi, chek botga yoki shu kontaktga yuboriladi. */
export const PAYMENT_CARD = (process.env.PAYMENT_CARD ?? '9860160141174617').replace(/\s/g, '');
export const PAYMENT_CONTACT = (process.env.PAYMENT_CONTACT ?? 'belugadotenv').replace(/^@/, '');
export const PAYMENT_PRICE = process.env.PAYMENT_PRICE ?? "39 000 so'm";
/** Karta egasi — ixtiyoriy, kabinetdagi to'lov blokida ko'rsatiladi */
export const PAYMENT_HOLDER = process.env.PAYMENT_HOLDER ?? '';

/** "9860160141174617" → "9860 1601 4117 4617" */
export function formattedCard(): string {
  return PAYMENT_CARD.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function telegramEnabled(): boolean {
  return Boolean(TOKEN && ADMIN_CHAT_ID);
}

/** Bot API chaqiruvi; muvaffaqiyatli bo'lsa natijani (result), aks holda null qaytaradi. */
async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`${API_BASE}/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Telegram ${method} failed: ${res.status} ${await res.text()}`);
      return null;
    }
    const data = (await res.json().catch(() => null)) as { result?: T } | null;
    return data?.result ?? null;
  } catch (err) {
    // Telegram ishlamasa ham sayt ishlashda davom etadi — admin /admin'dan tasdiqlaydi
    console.error(`Telegram ${method} error`, err);
    return null;
  }
}

interface SentMessage {
  message_id: number;
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

/** Xabar yuboradi; yuborilgan xabar id'si yoki (yetkazilmasa) null. replyTo — shu xabarga javob sifatida. */
export async function sendToChat(chatId: number | string, html: string, replyTo?: number): Promise<number | null> {
  const sent = await call<SentMessage>('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyTo ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {}),
    // Bot avval tug'ilgan kun loyihasida ishlagan — chatlarda o'shaning pastki tugmalari qolgan, olib tashlaymiz
    reply_markup: { remove_keyboard: true },
  });
  return sent?.message_id ?? null;
}

/** Foydalanuvchi xabarini admin chatiga forward qiladi; admin chatidagi nusxa id'si yoki null. */
export async function forwardToAdmin(fromChatId: number, messageId: number): Promise<number | null> {
  if (!ADMIN_CHAT_ID) return null;
  const sent = await call<SentMessage>('forwardMessage', { chat_id: ADMIN_CHAT_ID, from_chat_id: fromChatId, message_id: messageId });
  return sent?.message_id ?? null;
}

const MAX_SEND_ATTEMPTS = 4;

/**
 * Faylni chatga yuboradi (backup). Muvaffaqiyatsiz bo'lsa — xato: chaqiruvchi
 * yuborilmaganini bilishi shart. Telegram "sekinroq" desa (429), aytgan vaqtcha kutadi.
 */
export async function sendDocument(
  chatId: number | string,
  data: Buffer,
  filename: string,
  contentType: string,
  caption: string
): Promise<{ messageId: number; fileId: string }> {
  for (let attempt = 1; ; attempt += 1) {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('caption', caption);
    form.append('disable_notification', 'true');
    form.append('disable_content_type_detection', 'true');
    form.append('document', new Blob([data], { type: contentType }), filename);
    const res = await fetch(`${API_BASE}/bot${TOKEN}/sendDocument`, { method: 'POST', body: form });
    const body = (await res.json().catch(() => null)) as {
      ok?: boolean;
      description?: string;
      parameters?: { retry_after?: number };
      result?: { message_id: number; document?: { file_id: string } };
    } | null;
    if (body?.ok && body.result?.document) {
      return { messageId: body.result.message_id, fileId: body.result.document.file_id };
    }
    const retryAfter = body?.parameters?.retry_after;
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_SEND_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, ((retryAfter ?? 5) + 1) * 1000));
      continue;
    }
    throw new Error(body?.description ?? `Telegram sendDocument: ${res.status}`);
  }
}

/** Kanal haqida (bot unga kira olmasa — null); username bor bo'lsa, kanal ochiq. */
export async function getChannelInfo(chatId: number): Promise<{ title: string; username?: string } | null> {
  const chat = await call<{ type: string; title?: string; username?: string }>('getChat', { chat_id: chatId });
  return chat && chat.type === 'channel' ? { title: chat.title ?? '', username: chat.username } : null;
}

export async function botIsChannelAdmin(chatId: number): Promise<boolean> {
  const me = await call<{ id: number }>('getMe', {});
  if (!me) return false;
  const member = await call<{ status: string; can_post_messages?: boolean }>('getChatMember', { chat_id: chatId, user_id: me.id });
  return member?.status === 'creator' || (member?.status === 'administrator' && member.can_post_messages !== false);
}

/** Istalgan turdagi xabarni (rasm, ovoz, stiker...) "forwarded" belgisisiz nusxalaydi. */
export async function copyMessage(toChatId: number | string, fromChatId: number | string, messageId: number): Promise<number | null> {
  const sent = await call<SentMessage>('copyMessage', { chat_id: toChatId, from_chat_id: fromChatId, message_id: messageId });
  return sent?.message_id ?? null;
}

export type ApprovalKind = 'new' | 'reminder' | 'receipt';

const APPROVAL_HEADERS: Record<Exclude<ApprovalKind, 'new'>, string> = {
  reminder: '⏰ <b>Foydalanuvchi botga kirdi — to\'lov kutilmoqda</b>',
  receipt: '🧾 <b>To\'lov cheki keldi (yuqoridagi xabar)</b>',
};

/** Admin chatiga tasdiq so'rovi; yuborilgan xabar id'si yoki null. */
export async function sendApprovalRequest(info: ApprovalInfo, kind: ApprovalKind = 'new'): Promise<number | null> {
  if (!telegramEnabled()) return null;
  const keyboard: { text: string; callback_data?: string; url?: string }[][] = [
    [
      { text: '✅ Tasdiqlash', callback_data: `approve:${info.id}` },
      { text: '❌ Rad etish', callback_data: `reject:${info.id}` },
    ],
  ];
  // Imzolangan havola — tasdiqlanmagan qoralama ham kirmasdan, istalgan brauzerda ochiladi
  if (PUBLIC_URL.startsWith('https://')) {
    keyboard.push([{ text: "👁 Ko'rish", url: `${PUBLIC_URL}/${info.slug}?k=${previewKey(info.id)}` }]);
  }
  const sent = await call<SentMessage>('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: kind === 'new' ? approvalText(info) : `${APPROVAL_HEADERS[kind]}\n\n${approvalText(info, false)}`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard },
  });
  return sent?.message_id ?? null;
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
