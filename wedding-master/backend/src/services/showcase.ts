import { Invitation } from '../models/Invitation';
import { getShowcaseCache, setShowcaseCache } from './publicCache';

/** Ko'rgazmadagi bitta taklifnoma — kartochka uchun yetarli, ochiq ma'lumotlar. */
export interface ShowcaseItem {
  slug: string;
  template: string;
  groomName: string;
  brideName: string;
  eventTitle: string;
  date: string;
  venueName: string;
  /** Kartochka rasmi (/uploads/…); bo'lmasa shablon miniatyurasi chiziladi */
  photo: string;
}

/** Ko'rgazmadagi eng ko'p taklifnoma soni (sahifalab beriladi). */
const MAX_ITEMS = 500;

/**
 * Admin namuna qilib belgilagan va nashrda turgan taklifnomalar, eng yangi
 * belgilangani birinchi. Nashrdan olinsa ro'yxatdan o'zi chiqadi.
 */
export async function getShowcase(): Promise<ShowcaseItem[]> {
  const cached = getShowcaseCache<ShowcaseItem[]>();
  if (cached) return cached;
  const list = await Invitation.find({ featured: true, status: 'published' })
    .sort({ featuredAt: -1 })
    .limit(MAX_ITEMS)
    .select('slug template groomName brideName eventTitle date venueName coverPhoto couplePhoto gallery')
    .lean();
  const items = list.map((inv) => ({
    slug: inv.slug,
    template: inv.template,
    groomName: inv.groomName,
    brideName: inv.brideName,
    eventTitle: inv.eventTitle,
    date: inv.date,
    venueName: inv.venueName,
    photo: inv.coverPhoto || inv.couplePhoto || inv.gallery?.[0] || '',
  }));
  setShowcaseCache(items);
  return items;
}
