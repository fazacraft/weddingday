import type { TemplateKey } from '../models/Invitation';

/**
 * Telegram xabarlari uchun shablonlarning ko'rinadigan nomlari.
 * Record<TemplateKey, …> — yangi shablon qo'shilib, nomi unutilsa build xato beradi.
 */
export const TEMPLATE_NAMES: Record<TemplateKey, string> = {
  bog: "Bog'",
  anor: 'Anor',
  atirgul: 'Atirgul',
  kuz: 'Oltin kuz',
  osmon: 'Osmon',
};
