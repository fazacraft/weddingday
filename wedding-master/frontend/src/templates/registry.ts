import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { InvitationData, TemplateKey } from "../types/invitation";
import { withBase } from "../lib/base";

export interface TemplateMeta {
  key: TemplateKey;
  name: string;
  tagline: string;
  description: string;
  /** Kartochka va tanlash tugmalari uchun asosiy ranglar */
  palette: [string, string, string];
  defaultMusic: string;
  /** Namuna sahifasida umumiy demo ma'lumotlar ustidan yoziladigan maydonlar */
  demo?: Partial<InvitationData>;
  /**
   * Yangi taklifnomalar uchun tanlab bo'lmaydi (landing, wizard, namuna sahifasida
   * yo'q), lekin shu shablondagi mavjud taklifnomalar avvalgidek ishlaydi.
   */
  hidden?: boolean;
  Component: LazyExoticComponent<ComponentType>;
}

export const TEMPLATES: Record<TemplateKey, TemplateMeta> = {
  bog: {
    key: "bog",
    name: "Bog'",
    tagline: "Yashil arka, kaptarlar va gul yaproqlari",
    description:
      "Musiqali kirish ekrani, parallaks arka, uchib yurgan kaptarlar va real vaqtdagi tilaklar devori. Lotin va kirill yozuvida.",
    palette: ["#f0ece3", "#30401c", "#e8c4c0"],
    defaultMusic: withBase("/leberch-invitation-wedding-375839.mp3"),
    Component: lazy(() => import("./bog/BogTemplate")),
  },
  anor: {
    key: "anor",
    name: "Anor",
    tagline: "Muhrlangan konvert, karnaylar va anor novdalari",
    description:
      "Mehmon avval qizil muhrli konvertni ochadi. Milliy naqshli hoshiya, karnay-surnay, kalendar va qog'oz kartalar.",
    palette: ["#faf5ea", "#6e2323", "#c9a227"],
    defaultMusic: withBase("/templates/anor/music.mp3"),
    Component: lazy(() => import("./anor/AnorTemplate")),
  },
  atirgul: {
    key: "atirgul",
    name: "Atirgul",
    tagline: "Oq-pushti konvert, atirgul novdalari va yaproqlar",
    description:
      "Pushti muhrli oq konvert ichidan maktub ko'tariladi. Arka shaklidagi rasm, tushayotgan atirgul yaproqlari, yurakli kalendar va gulli dastur.",
    palette: ["#fff5f7", "#f2a9b9", "#b84a68"],
    defaultMusic: withBase("/leberch-invitation-wedding-375839.mp3"),
    Component: lazy(() => import("./atirgul/AtirgulTemplate")),
  },
  kuz: {
    key: "kuz",
    name: "Oltin kuz",
    tagline: "Kanop ip bilan bog'langan kraft karta va kuz barglari",
    description:
      "Mehmon muhrni bosadi — ip yechilib, kraft karta ikki tomonga ochiladi va ichidan barglar uchib chiqadi. Aylanib tushayotgan chinor barglari, gulchambarli oval rasm, chinor bargli kalendar va eman yong'oqli dastur.",
    palette: ["#fbf4e8", "#e2a23a", "#bb5226"],
    defaultMusic: withBase("/leberch-invitation-wedding-375839.mp3"),
    // Kuz shabloni namunasi kuz sanasida ko'rsatiladi ("oltin kuz faslida" belgisi chiqadi)
    demo: { date: "2027-10-16" },
    // 2026-10-23 dan yangi taklifnomalar uchun yopilgan; mavjudlari (masalan, /somsa) ishlayveradi
    hidden: true,
    Component: lazy(() => import("./kuz/KuzTemplate")),
  },
  osmon: {
    key: "osmon",
    name: "Osmon",
    tagline: "Oltin muhrli qog'oz konvert, bulutlar va moviy ranglar",
    description:
      "Butun ekranni egallagan qog'oz konvert oltin muhr bilan ochiladi. Rasmli hero, qo'lda chizilgan yurak va bulutlar, mehmon barmog'i bilan artib ochadigan sana kartasi.",
    palette: ["#fffdfb", "#64a0bd", "#c8aa78"],
    // "Seni osmonimga olib ketaman" — qisqa qism, shablonda takrorlanib chalinadi
    defaultMusic: withBase("/templates/osmon/music.mp3"),
    Component: lazy(() => import("./osmon/OsmonTemplate")),
  },
};

/** Yangi taklifnoma uchun tanlash mumkin bo'lgan shablonlar (yashirinlarisiz). */
export const TEMPLATE_LIST = Object.values(TEMPLATES).filter((tpl) => !tpl.hidden);

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && value in TEMPLATES;
}

/** Mavjud va yashirilmagan shablon — yangi taklifnoma va namuna sahifasi uchun. */
export function isSelectableTemplate(value: unknown): value is TemplateKey {
  return isTemplateKey(value) && !TEMPLATES[value].hidden;
}
