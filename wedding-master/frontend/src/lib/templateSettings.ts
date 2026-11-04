import { useSyncExternalStore } from "react";
import { api, mediaUrl } from "./api";
import { EMPTY_INVITATION, type InvitationData, type TemplateKey } from "../types/invitation";

/*
 * Admin panelda o'zgartirilgan shablon standartlari (backend models/TemplateSettings).
 * Server ularni har bir sahifa HTML'iga qo'shadi (window.__TEMPLATE_SETTINGS__) —
 * qo'shilmagan bo'lsa (lokal Vite), bir marta API'dan so'raladi. Bo'sh qiymat —
 * kodda o'rnatilgan standart.
 */

export const TEMPLATE_TEXT_KEYS = ["eventTitle", "inviteText", "greetingHeading", "greetingMessage"] as const;
export type TemplateTextKey = (typeof TEMPLATE_TEXT_KEYS)[number];

export interface TemplatePhotos {
  cover?: string;
  couple?: string;
  venue?: string;
  gallery?: string[];
}

export interface TemplateSettings {
  texts?: Partial<Record<TemplateTextKey, string>>;
  music?: string;
  photos?: TemplatePhotos;
}

export type TemplateSettingsMap = Partial<Record<TemplateKey, TemplateSettings>>;

declare global {
  interface Window {
    __TEMPLATE_SETTINGS__?: TemplateSettingsMap;
  }
}

let current: TemplateSettingsMap = window.__TEMPLATE_SETTINGS__ ?? {};
let requested = Boolean(window.__TEMPLATE_SETTINGS__);
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!requested) {
    requested = true;
    api<TemplateSettingsMap>("/templates/settings", { token: "" })
      .then(setTemplateSettings)
      .catch(() => {});
  }
  return () => listeners.delete(listener);
}

export function setTemplateSettings(map: TemplateSettingsMap): void {
  current = map;
  listeners.forEach((listener) => listener());
}

export function getTemplateSettings(): TemplateSettingsMap {
  return current;
}

export function useTemplateSettings(): TemplateSettingsMap {
  return useSyncExternalStore(subscribe, getTemplateSettings);
}

/** Shablonning standart matnlari (admin o'zgartirganlari yoki o'rnatilganlari). */
export function templateTexts(key: TemplateKey, map = current): Record<TemplateTextKey, string> {
  const texts = map[key]?.texts ?? {};
  return Object.fromEntries(TEMPLATE_TEXT_KEYS.map((k) => [k, texts[k] || EMPTY_INVITATION[k]])) as Record<TemplateTextKey, string>;
}

/**
 * Wizard'da shablon almashtirilganda: foydalanuvchi o'zgartirmagan (standart
 * turgan) matnlar yangi shablonning standart matniga almashadi.
 */
export function switchTemplate(data: InvitationData, template: TemplateKey): Partial<InvitationData> {
  const before = templateTexts(data.template);
  const after = templateTexts(template);
  const patch: Partial<InvitationData> = { template };
  for (const k of TEMPLATE_TEXT_KEYS) {
    if (!data[k] || data[k] === before[k] || data[k] === EMPTY_INVITATION[k]) patch[k] = after[k];
  }
  return patch;
}

/** O'z musiqasi tanlanmagan taklifnomada chalinadigan musiqa (to'liq manzil). */
export function templateMusic(key: TemplateKey, builtIn: string, map = current): string {
  const music = map[key]?.music;
  return music ? mediaUrl(music) : builtIn;
}
