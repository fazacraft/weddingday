/*
 * Wizard'dagi musiqa kutubxonasi: foydalanuvchi eshitib ko'rib tanlaydi.
 * Tanlanganda musicUrl'ga shu yo'l (BASE'siz) yoziladi; o'ynatishda mediaUrl
 * uni BASE bilan to'ldiradi. Yangi musiqa qo'shish: faylni public/ ga qo'yib,
 * shu ro'yxatga bitta qator yozish kifoya.
 */

export interface MusicTrack {
  url: string;
  title: string;
  /** Ijrochi yoki qaysi shablonniki ekani */
  note: string;
  duration: string;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    url: "/templates/osmon/music.mp3",
    title: "Seni osmonimga olib ketaman",
    note: "«Osmon» shablonining musiqasi · qisqa qism",
    duration: "0:27",
  },
  {
    url: "/leberch-invitation-wedding-375839.mp3",
    title: "Wedding Invitation",
    note: "Leberch · «Bog'» va «Atirgul» musiqasi",
    duration: "1:50",
  },
  {
    url: "/templates/anor/music.mp3",
    title: "Anor kuyi",
    note: "«Anor» shablonining musiqasi",
    duration: "2:22",
  },
];
