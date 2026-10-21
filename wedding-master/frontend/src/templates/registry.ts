import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { TemplateKey } from "../types/invitation";

export interface TemplateMeta {
  key: TemplateKey;
  name: string;
  tagline: string;
  description: string;
  /** Kartochka va tanlash tugmalari uchun asosiy ranglar */
  palette: [string, string, string];
  defaultMusic: string;
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
    defaultMusic: "/leberch-invitation-wedding-375839.mp3",
    Component: lazy(() => import("./bog/BogTemplate")),
  },
  anor: {
    key: "anor",
    name: "Anor",
    tagline: "Muhrlangan konvert, karnaylar va anor novdalari",
    description:
      "Mehmon avval qizil muhrli konvertni ochadi. Milliy naqshli hoshiya, karnay-surnay, kalendar va qog'oz kartalar.",
    palette: ["#faf5ea", "#6e2323", "#c9a227"],
    defaultMusic: "/templates/anor/music.mp3",
    Component: lazy(() => import("./anor/AnorTemplate")),
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && value in TEMPLATES;
}
