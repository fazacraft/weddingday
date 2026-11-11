import { api } from "./api";
import { SLUG_RE } from "./site";

/*
 * Taklifnoma ostidagi "Shunday taklifnoma yaratish" (?ref=<slug>) orqali kelganlar.
 * Kelish bir brauzerdan bir marta sanaladi; 30 kun ichida taklifnoma yaratsa,
 * u qaysi taklifnomadan kelgani yoziladi (admin panelda ko'rinadi).
 */
const REF_KEY = "fz-ref";
const SEEN_KEY = "fz-ref-seen";
const REF_TTL_MS = 30 * 24 * 3_600_000;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage yo'q — sanalmaydi, xolos */
  }
}

/** /yaratish?ref=... bilan kelganda chaqiriladi. */
export function rememberReferral(slug: string | null): void {
  if (!slug || !SLUG_RE.test(slug)) return;
  write(REF_KEY, { slug, at: Date.now() });
  const seen = read<string[]>(SEEN_KEY, []);
  if (seen.includes(slug)) return;
  write(SEEN_KEY, [...seen, slug].slice(-20));
  void api(`/public/${slug}/ref-visit`, { method: "POST", token: "" }).catch(() => {});
}

/** Yangi taklifnoma yaratilayotganda: yaqinda kelgan bo'lsa — manba taklifnoma. */
export function activeReferral(): string | undefined {
  const ref = read<{ slug?: string; at?: number } | null>(REF_KEY, null);
  return ref?.slug && Date.now() - (ref.at ?? 0) < REF_TTL_MS ? ref.slug : undefined;
}
