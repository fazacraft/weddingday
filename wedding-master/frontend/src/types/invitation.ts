export type TemplateKey = "bog" | "anor" | "atirgul" | "kuz" | "osmon";

/** Galereyadagi rasmlar soni chegarasi (backend'dagi GALLERY_MAX bilan bir xil). */
export const GALLERY_MAX = 6;

export interface ScheduleItem {
  time: string;
  title: string;
}

export interface InvitationFeatures {
  wishes: boolean;
  rsvp: boolean;
  gift: boolean;
}

/** Wizard'da to'ldiriladigan va backend'da saqlanadigan barcha maydonlar. */
export interface InvitationData {
  slug: string;
  template: TemplateKey;
  groomName: string;
  brideName: string;
  /** YYYY-MM-DD, Toshkent vaqti bo'yicha */
  date: string;
  /** HH:mm */
  time: string;
  eventTitle: string;
  inviteText: string;
  greetingHeading: string;
  greetingMessage: string;
  venueName: string;
  venueAddress: string;
  venueLandmark: string;
  googleMapUrl: string;
  yandexMapUrl: string;
  schedule: ScheduleItem[];
  couplePhoto: string;
  /** Muqova (hero foni) — hozircha "Osmon" shablonida */
  coverPhoto: string;
  venuePhoto: string;
  /** Fotogalereya, ko'pi bilan GALLERY_MAX ta */
  gallery: string[];
  musicUrl: string;
  /** O'zi yuklagan qo'shiqning nomi — admin tasdiqlasa umumiy ro'yxatda shu nom bilan chiqadi */
  musicTitle: string;
  cardNumber: string;
  cardHolder: string;
  dressCode: string;
  features: InvitationFeatures;
}

export interface PublicInvitation extends InvitationData {
  id: string;
  status: "draft" | "published";
}

export interface InvitationStats {
  wishes: number;
  replies: number;
  coming: number;
  declined: number;
}

export type ReviewState = "none" | "pending" | "approved" | "rejected";

export interface OwnedInvitation extends PublicInvitation {
  /** Nashr uchun admin tasdig'i */
  review?: ReviewState;
  reviewRequestedAt?: string;
  /** Tasdiq kechiksa yoziladigan Telegram bot (username) */
  supportBot?: string;
  openCount: number;
  createdAt: string;
  updatedAt: string;
  stats?: InvitationStats;
}

export interface Wish {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
}

export interface Rsvp {
  _id: string;
  name: string;
  attending: boolean;
  guests: number;
  createdAt: string;
}

export const EMPTY_INVITATION: InvitationData = {
  slug: "",
  template: "bog",
  groomName: "",
  brideName: "",
  date: "",
  time: "18:00",
  eventTitle: "Nikoh to'yi",
  inviteText: "Sizni to'yimiz shodiyonasiga taklif etamiz",
  greetingHeading: "Aziz va qadrdon insonimiz!",
  greetingMessage:
    "Hayotimizdagi eng baxtli kunlardan biri - to'yimizni siz bilan birga nishonlashni niyat qildik.\n\n" +
    "Quvonchli kunimizda aziz mehmonimiz bo'lishingizni intizorlik bilan kutamiz.",
  venueName: "",
  venueAddress: "",
  venueLandmark: "",
  googleMapUrl: "",
  yandexMapUrl: "",
  schedule: [],
  couplePhoto: "",
  coverPhoto: "",
  venuePhoto: "",
  gallery: [],
  musicUrl: "",
  musicTitle: "",
  cardNumber: "",
  cardHolder: "",
  dressCode: "",
  features: { wishes: true, rsvp: true, gift: false },
};

/** Shablon demolari va bo'sh wizard ko'rinishi uchun namunaviy ma'lumot. */
export const DEMO_INVITATION: InvitationData = {
  ...EMPTY_INVITATION,
  slug: "mirodil-jasmina",
  groomName: "Mirodil",
  brideName: "Jasmina",
  date: "2027-06-12",
  time: "18:00",
  venueName: "Atlas to'yxonasi",
  venueAddress: "Toshkent shahri, Yunusobod tumani",
  googleMapUrl: "https://maps.google.com/?q=Tashkent",
  yandexMapUrl: "https://yandex.uz/maps/?text=Toshkent",
  schedule: [
    { time: "18:00", title: "Mehmonlarni kutib olish" },
    { time: "18:30", title: "Kelin-kuyov kirib kelishi" },
    { time: "19:00", title: "Ota-onalar tabrigi" },
    { time: "20:00", title: "Bazm va raqslar" },
  ],
  dressCode: "Milliy kiyim",
  cardNumber: "8600 1234 5678 9012",
  cardHolder: "MIRODIL RAHMONOV",
  features: { wishes: true, rsvp: true, gift: true },
};

export const DEMO_WISHES: Wish[] = [
  {
    _id: "demo-1",
    name: "Malika opa",
    message: "Baxtli bo'linglar! Oilangiz mustahkam, uyingiz doim to'kin bo'lsin.",
    createdAt: "2027-05-20T10:00:00Z",
  },
  {
    _id: "demo-2",
    name: "Sardor",
    message: "Do'stim, chin yurakdan tabriklayman! Bir yostiqqa bosh qo'yib qarishinglarni tilayman.",
    createdAt: "2027-05-21T12:30:00Z",
  },
  {
    _id: "demo-3",
    name: "Nilufar",
    message: "Sizlarga sevgi, sabr va cheksiz baxt tilayman!",
    createdAt: "2027-05-22T08:15:00Z",
  },
];

/** Toshkent vaqti (UTC+5) bo'yicha to'liq ISO sana. */
export function weddingIso(data: Pick<InvitationData, "date" | "time">): string {
  const date = data.date || "2027-01-01";
  const time = data.time || "18:00";
  return `${date}T${time}:00+05:00`;
}

export function greetingParagraphs(message: string): string[] {
  return message
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
