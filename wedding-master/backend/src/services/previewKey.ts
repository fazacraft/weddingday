import crypto from 'crypto';
import { JWT_SECRET } from '../middleware/auth';

/**
 * Tasdiqlanmagan taklifnomani ko'rish havolasi: /<slug>?k=<kalit>. Kalit —
 * taklifnoma id'sining sirli imzosi (HMAC), uni faqat server yasay oladi;
 * boshqa taklifnomaga mos kelmaydi va id/slug'dan taxmin qilib bo'lmaydi.
 */
export function previewKey(invitationId: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(`preview:${invitationId}`).digest('base64url').slice(0, 24);
}

export function isPreviewKey(invitationId: string, key: unknown): boolean {
  if (typeof key !== 'string' || !key) return false;
  const expected = Buffer.from(previewKey(invitationId));
  const given = Buffer.from(key);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}
