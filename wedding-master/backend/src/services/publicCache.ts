/*
 * Nashr qilingan taklifnomalarning qisqa muddatli xotira keshi.
 *
 * Taklifnoma havolasi guruhlarga tashlanganda o'nlab mehmon bir vaqtda ochadi;
 * baza esa serverdan uzoqda bo'lishi mumkin — har bir so'rovda bazaga borish
 * sekin. Model saqlanganda/o'chirilganda kesh darhol tozalanadi (Invitation
 * schema hook'lari), shuning uchun tahrir mehmonlarga kechikmay yetadi.
 *
 * Bu modul hech narsani import qilmaydi — model ham uni import qiladi.
 */

const TTL_MS = 60_000;
/** "Bunday taklifnoma yo'q" javobi ham keshlanadi, lekin qisqaroq */
const MISS_TTL_MS = 10_000;
const MAX_ENTRIES = 1000;

const entries = new Map<string, { value: unknown; expires: number }>();

export function getCached<T>(slug: string): T | null | undefined {
  const entry = entries.get(slug);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    entries.delete(slug);
    return undefined;
  }
  return entry.value as T | null;
}

export function setCached<T>(slug: string, value: T | null): void {
  if (entries.size >= MAX_ENTRIES) entries.clear();
  entries.set(slug, { value, expires: Date.now() + (value ? TTL_MS : MISS_TTL_MS) });
}

export function invalidatePublic(...slugs: (string | undefined | null)[]): void {
  for (const slug of slugs) if (slug) entries.delete(slug);
}
