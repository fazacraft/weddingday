import { Invitation, publicInvitation } from '../models/Invitation';
import { getCached, setCached } from './publicCache';

export type PublicSnapshot = ReturnType<typeof publicInvitation>;

/**
 * Nashr qilingan taklifnoma (mehmonlar ko'radigan ko'rinishda) — xotira keshidan,
 * bo'lmasa bazadan. Qoralama yoki tasdiqlanmagan bo'lsa null: ularni faqat
 * egasi/admin ko'radi va bu yo'l keshlanmaydi (publicController.findVisible).
 */
export async function getPublishedSnapshot(slug: string): Promise<PublicSnapshot | null> {
  const key = slug.toLowerCase();
  const cached = getCached<PublicSnapshot>(key);
  if (cached !== undefined) return cached;
  const inv = await Invitation.findOne({ slug: key, status: 'published' });
  const snapshot = inv ? publicInvitation(inv) : null;
  setCached(key, snapshot);
  return snapshot;
}
