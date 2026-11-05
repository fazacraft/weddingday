/*
 * Saytga o'rnatilgan musiqalar nomi — "Shablon musiqasi" yozuvi uchun. Ro'yxatning
 * o'zi serverdan keladi (GET /api/music); yangisi backend services/musicLibrary.ts
 * dagi BUILT_IN_TRACKS ga qo'shiladi yoki admin paneldan yuklanadi.
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
