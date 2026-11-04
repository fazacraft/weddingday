import { Schema, model, Document } from 'mongoose';
import { GALLERY_MAX, TEMPLATE_KEYS, TemplateKey } from './Invitation';

/**
 * Admin panelda o'zgartiriladigan shablon standartlari. Bo'sh qiymat —
 * frontend'dagi o'rnatilgan standart ishlatiladi.
 *  - texts: yangi taklifnoma wizard'ida va /shablonlar namunasida chiqadigan matnlar
 *    (mavjud taklifnomalar o'z matnini saqlab qolgan — ularga ta'sir qilmaydi);
 *  - music: o'z musiqasini tanlamagan barcha taklifnomalarda chalinadi;
 *  - photos: "Osmon"da rasm yuklanmaganda ko'rsatiladigan namuna rasmlar.
 */
export const TEMPLATE_TEXT_KEYS = ['eventTitle', 'inviteText', 'greetingHeading', 'greetingMessage'] as const;
export type TemplateTextKey = (typeof TEMPLATE_TEXT_KEYS)[number];
export const TEMPLATE_PHOTO_KEYS = ['cover', 'couple', 'venue'] as const;
export type TemplatePhotoKey = (typeof TEMPLATE_PHOTO_KEYS)[number];

export interface ITemplateSettings extends Document {
  key: TemplateKey;
  texts: Record<TemplateTextKey, string>;
  music: string;
  photos: Record<TemplatePhotoKey, string> & { gallery: string[] };
}

const templateSettingsSchema = new Schema<ITemplateSettings>(
  {
    key: { type: String, enum: TEMPLATE_KEYS, required: true, unique: true },
    texts: {
      eventTitle: { type: String, default: '', maxlength: 80 },
      inviteText: { type: String, default: '', maxlength: 300 },
      greetingHeading: { type: String, default: '', maxlength: 120 },
      greetingMessage: { type: String, default: '', maxlength: 2000 },
    },
    music: { type: String, default: '' },
    photos: {
      cover: { type: String, default: '' },
      couple: { type: String, default: '' },
      venue: { type: String, default: '' },
      gallery: { type: [String], default: [], validate: (v: string[]) => v.length <= GALLERY_MAX },
    },
  },
  { timestamps: true }
);

export const TemplateSettings = model<ITemplateSettings>('TemplateSettings', templateSettingsSchema);
