import {
  TEMPLATE_PHOTO_KEYS,
  TEMPLATE_TEXT_KEYS,
  TemplateSettings,
  type ITemplateSettings,
} from '../models/TemplateSettings';

/** Frontend'ga boradigan ko'rinish: faqat o'zgartirilgan (bo'sh bo'lmagan) qiymatlar. */
export interface PublicTemplateSettings {
  texts?: Partial<Record<string, string>>;
  music?: string;
  photos?: { cover?: string; couple?: string; venue?: string; gallery?: string[] };
}
export type TemplateSettingsMap = Partial<Record<string, PublicTemplateSettings>>;

function pickFilled<K extends string>(keys: readonly K[], source: Partial<Record<K, string>> | undefined) {
  const out: Partial<Record<K, string>> = {};
  for (const key of keys) if (source?.[key]) out[key] = source[key];
  return out;
}

export function publicTemplateSettings(doc: Pick<ITemplateSettings, 'texts' | 'music' | 'photos'>): PublicTemplateSettings {
  const out: PublicTemplateSettings = {};
  const texts = pickFilled(TEMPLATE_TEXT_KEYS, doc.texts);
  if (Object.keys(texts).length) out.texts = texts;
  if (doc.music) out.music = doc.music;
  const photos: PublicTemplateSettings['photos'] = pickFilled(TEMPLATE_PHOTO_KEYS, doc.photos);
  if (doc.photos?.gallery?.length) photos.gallery = [...doc.photos.gallery];
  if (Object.keys(photos).length) out.photos = photos;
  return out;
}

/*
 * Har bir sahifa HTML'iga qo'shiladi — shuning uchun xotirada saqlanadi va
 * faqat admin o'zgartirganda yangilanadi (bitta app konteyneri).
 */
let cache: TemplateSettingsMap | null = null;

export async function getTemplateSettings(): Promise<TemplateSettingsMap> {
  if (cache) return cache;
  const docs = await TemplateSettings.find().lean();
  const map: TemplateSettingsMap = {};
  for (const doc of docs) {
    const settings = publicTemplateSettings(doc);
    if (Object.keys(settings).length) map[doc.key] = settings;
  }
  cache = map;
  return map;
}

export function invalidateTemplateSettings(): void {
  cache = null;
}

/** Shablon standartlarida ishlatilayotgan fayllar — taklifnoma/musiqa o'chirilganda saqlab qolinadi. */
export async function templateMedia(): Promise<Set<string>> {
  const all = Object.values(await getTemplateSettings());
  return new Set(
    all.flatMap((s) => [s?.music, s?.photos?.cover, s?.photos?.couple, s?.photos?.venue, ...(s?.photos?.gallery ?? [])]).filter(
      (url): url is string => Boolean(url)
    )
  );
}
