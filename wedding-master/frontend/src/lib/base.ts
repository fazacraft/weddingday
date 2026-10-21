/**
 * Sayt domen ildizida ("/") yoki ichki yo'lda ("/erbotayev/") ishlashi mumkin —
 * build paytida BASE_PATH orqali beriladi (vite.config.ts → import.meta.env.BASE_URL).
 */
export const BASE = import.meta.env.BASE_URL;

/** "/assets/arc.png" → "/erbotayev/assets/arc.png" (ildizda o'zgarishsiz). */
export function withBase(path: string): string {
  return BASE + path.replace(/^\//, "");
}
