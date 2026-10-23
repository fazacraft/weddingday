/*
 * "Osmon" shablonining rasm joylari. Shablonning o'zi ham, wizard'dagi
 * "taklifnomada shunday chiqadi" ko'rinishi ham shu funksiyadan foydalanadi —
 * ikkalasi bir xil natija ko'rsatishi uchun (CSS'siz, yengil modul).
 *
 * Bu yerda xom yo'llar ("/uploads/…", "/templates/…") bilan ishlanadi; to'liq
 * manzil va kerakli o'lcham chaqiruvchida mediaUrl(path, width) bilan olinadi.
 */

/** Namunaviy rasmlar (Pexels litsenziyasi — tijoriy foydalanish bepul). */
const IMG = "/templates/osmon";
export const OSMON_SAMPLES = {
  cover: `${IMG}/cover.jpg`,
  couple: `${IMG}/couple.jpg`,
  venue: `${IMG}/venue.jpg`,
  gallery: [1, 2, 3, 4].map((n) => `${IMG}/gallery-${n}.jpg`),
};

export interface OsmonPhotos {
  hero: string;
  /** Bo'sh — juftlik kartasi ko'rsatilmaydi */
  card: string;
  venue: string;
  gallery: string[];
  /** Shaxsiy rasm yo'q — hamma joyda namuna */
  sample: boolean;
}

/**
 * Egasi hech qanday shaxsiy rasm yuklamagan bo'lsa — to'liq namunaviy
 * ko'rinish. Biror rasm yuklangan bo'lsa, begona juftlik rasmlari
 * aralashmasligi uchun bo'sh joylar egasining rasmlari bilan to'ldiriladi yoki
 * yashiriladi. To'yxona rasmi umumiy manzara, shuning uchun doim to'ldiriladi.
 */
export function resolveOsmonPhotos(cover: string, couple: string, venue: string, gallery: string[]): OsmonPhotos {
  if (!cover && !couple && gallery.length === 0) {
    return {
      hero: OSMON_SAMPLES.cover,
      card: OSMON_SAMPLES.couple,
      venue: venue || OSMON_SAMPLES.venue,
      gallery: OSMON_SAMPLES.gallery,
      sample: true,
    };
  }
  const hero = cover || couple || gallery[0];
  return { hero, card: couple && couple !== hero ? couple : "", venue: venue || OSMON_SAMPLES.venue, gallery, sample: false };
}
