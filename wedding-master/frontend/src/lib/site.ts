import { toLatin } from "./transliterate";
import { BASE } from "./base";

export const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Fozilovlar";
export const SITE_DOMAIN = import.meta.env.VITE_SITE_DOMAIN || "fozilovlar.uz";

/** Mehmonlarga yuboriladigan to'liq havola (joriy origin bo'yicha — lokalda ham ishlaydi). */
export function inviteUrl(slug: string): string {
  return `${window.location.origin}${BASE}${slug}`;
}

/** Ko'rsatish uchun qisqa havola: "fozilovlar.uz/feruz-dilfuza" yoki "localhost:5173/...". */
export function inviteLabel(slug: string): string {
  return `${window.location.host}${BASE}${slug}`;
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/;

/** Ismlardan URL uchun qisqa manzil: "Feruz", "Dilfuza" → "feruz-dilfuza". */
export function slugify(...parts: string[]): string {
  return parts
    .map((p) =>
      toLatin(p)
        .toLowerCase()
        .replace(/[ʻʼ'`’‘]/g, "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .join("-")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
