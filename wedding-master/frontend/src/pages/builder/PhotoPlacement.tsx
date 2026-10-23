import type { ReactNode } from "react";
import { mediaUrl, PHOTO_WIDTHS } from "../../lib/api";
import type { PhotoSlot } from "../../lib/previewFocus";
import { usePreview } from "./PreviewSheet";
import { resolveOsmonPhotos } from "../../templates/osmon/photos";
import { TEMPLATES } from "../../templates/registry";
import type { InvitationData } from "../../types/invitation";

/*
 * Wizard'dagi "taklifnomada shunday chiqadi" bloki: rasm qaysi bo'limda va
 * qanday ko'rinishini kichik telefon ekranida ko'rsatadi (ismlar qadamidagi
 * ko'rinish kabi). Rasm joylari shablondagi bilan bir xil funksiyadan olinadi.
 */

const HIGHLIGHT = "ring-2 ring-rose ring-offset-2 ring-offset-white";
const thumb = (path: string) => mediaUrl(path, PHOTO_WIDTHS.thumb);
const OSMON_SCRIPT = { fontFamily: '"Imperial Script", cursive' };
const OSMON_SERIF = { fontFamily: "Rufina, Georgia, serif" };

interface Props {
  slot: PhotoSlot;
  data: InvitationData;
}

export function PhotoPlacement({ slot, data }: Props) {
  const { show } = usePreview();
  const raw = resolveOsmonPhotos(data.coverPhoto, data.couplePhoto, data.venuePhoto, data.gallery);
  // Kichik telefon ekrani — eng kichik variant yetarli
  const photos = { ...raw, hero: thumb(raw.hero), card: thumb(raw.card), venue: thumb(raw.venue), gallery: raw.gallery.map(thumb) };
  const names = { groom: data.groomName || "Kuyov", bride: data.brideName || "Kelin" };
  const view = describe(slot, data, photos, names);

  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-sand/60 p-3 sm:p-4">
      <div className="relative h-[200px] w-[112px] shrink-0 overflow-hidden rounded-[18px] border-[3px] border-ink bg-white shadow-[0_14px_30px_-18px_rgba(31,26,23,0.6)]">
        {view.screen}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink/40">taklifnomada shunday chiqadi</p>
        <p className="mt-1.5 text-sm font-semibold text-ink">{view.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">{view.text}</p>
        {view.note && (
          <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink/55">{view.note}</span>
        )}
        <button
          type="button"
          onClick={() => show(slot)}
          className="mt-2 block py-1 text-xs font-semibold text-rose hover:text-rose-dark"
        >
          Taklifnomada ko'rish →
        </button>
      </div>
    </div>
  );
}

interface View {
  title: string;
  text: string;
  note?: string;
  screen: ReactNode;
}

function describe(
  slot: PhotoSlot,
  data: InvitationData,
  photos: ReturnType<typeof resolveOsmonPhotos>,
  names: { groom: string; bride: string }
): View {
  const sampleNote = photos.sample ? "Hozir namuna rasm turibdi" : undefined;
  const osmonTitle = (place: string) => (data.template === "osmon" ? place : `${place} · «Osmon» shablonida`);

  if (slot === "cover") {
    return {
      title: osmonTitle("Birinchi ekran foni"),
      text: "Konvert ochilgach chiqadigan ekran — ismlar va sana rasm ustida yoziladi.",
      note: data.coverPhoto ? undefined : photos.sample ? sampleNote : "Muqova yo'q — boshqa suratingiz ishlatilmoqda",
      screen: <OsmonCover src={photos.hero} names={names} date={data.date} />,
    };
  }

  if (slot === "venue") {
    return {
      title: osmonTitle("«To'y maskani» bo'limi"),
      text: "Manzil va xarita tugmalari ustidagi katta rasm.",
      note: data.venuePhoto ? undefined : "Hozir namuna rasm turibdi",
      screen: <OsmonVenue src={photos.venue} venueName={data.venueName} />,
    };
  }

  if (slot === "gallery") {
    return {
      title: osmonTitle("«Fotogalereya» bo'limi"),
      text: "Ikki ustunli to'r; mehmon bosganda rasm butun ekranda ochiladi.",
      note: data.gallery.length ? undefined : photos.sample ? sampleNote : "Yuklanmasa, galereya bo'limi chiqmaydi",
      screen: <OsmonGallery srcs={photos.gallery} />,
    };
  }

  // Kelin-kuyov surati — tanlangan shablonga qarab
  const couple = thumb(data.couplePhoto);
  const templateName = TEMPLATES[data.template]?.name ?? "Bog'";
  switch (data.template) {
    case "osmon":
      if (!photos.card && photos.hero === couple) {
        return {
          title: "Birinchi ekran foni",
          text: "Muqova rasmi yuklanmagani uchun bu surat birinchi ekranda, ismlar ostida chiqadi.",
          screen: <OsmonCover src={couple} names={names} date={data.date} />,
        };
      }
      return {
        title: "Tabrik ustidagi katta karta",
        text: "Konvert ochilib, birinchi ekrandan keyin — tabrik matni ustida.",
        note: sampleNote,
        screen: <OsmonCard src={photos.card} heading={data.greetingHeading} />,
      };
    case "anor":
      return {
        title: `${templateName}: ismlar ostida`,
        text: "Karnaylar orasidagi ismlar tagida, hoshiyali rasm bo'lib chiqadi.",
        screen: <AnorHero src={couple} names={names} />,
      };
    case "atirgul":
    case "kuz":
      return {
        title: `${templateName}: ${data.template === "kuz" ? "gulchambarli oval ramka" : "arka shaklidagi ramka"}`,
        text: "Birinchi ekranda, ismlar va sana ostida.",
        note: couple ? undefined : "Yuklanmasa, o'rnida bosh harflar turadi",
        screen: <FramedHero src={couple} names={names} oval={data.template === "kuz"} />,
      };
    default:
      return {
        title: `${templateName}: arka ramkada`,
        text: "Tabrik matni ostida, arka shaklidagi ramkada.",
        note: couple ? undefined : "Yuklanmasa, bu joy ko'rinmaydi",
        screen: <BogGreeting src={couple} heading={data.greetingHeading} />,
      };
  }
}

/* ── Kichik ekranlar ─────────────────────────────────────────────── */

function OsmonCover({ src, names, date }: { src: string; names: { groom: string; bride: string }; date: string }) {
  return (
    <div className={`absolute inset-1 overflow-hidden rounded-[13px] ${HIGHLIGHT}`}>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#26384499] via-[#26384466] to-[#263844b3]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1.5 text-center text-white" style={OSMON_SERIF}>
        <span className="text-[5px] uppercase tracking-[0.3em]">Nikoh to'yi</span>
        <span className="mt-1 text-[17px] leading-[1.05]" style={OSMON_SCRIPT}>
          {names.groom}
          <br />& {names.bride}
        </span>
        {date && <span className="mt-1 text-[6px] tracking-wider">{date.split("-").reverse().join(".")}</span>}
      </div>
    </div>
  );
}

function OsmonCard({ src, heading }: { src: string; heading: string }) {
  return (
    <div className="flex h-full flex-col items-center bg-[#fffdfb] px-2 pt-5">
      <div className={`aspect-[3/4] w-[78%] overflow-hidden rounded-[4px] shadow-md ${HIGHLIGHT}`}>
        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      </div>
      <span className="mt-3 text-center text-[11px] leading-tight text-[#52839c]" style={OSMON_SCRIPT}>
        {heading || "Aziz va qadrdon insonimiz!"}
      </span>
      <TextLines />
    </div>
  );
}

function OsmonVenue({ src, venueName }: { src: string; venueName: string }) {
  return (
    <div className="flex h-full flex-col items-center bg-[#fffdfb] px-2 pt-4" style={OSMON_SERIF}>
      <div className={`aspect-square w-[84%] overflow-hidden rounded-[5px] shadow-md ${HIGHLIGHT}`}>
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
      <svg viewBox="0 0 48 60" className="mt-2.5 h-3.5 w-3.5 text-[#64a0bd]" aria-hidden="true">
        <path d="M24 58C24 58 4 36 4 22C4 10 13 2 24 2C35 2 44 10 44 22C44 36 24 58 24 58Z" fill="currentColor" />
      </svg>
      <span className="mt-1 text-[12px] leading-none text-[#52839c]" style={OSMON_SCRIPT}>To'y maskani</span>
      <span className="mt-1.5 max-w-full truncate text-[7px] font-bold text-[#3a3a3a]">{venueName || "To'yxona nomi"}</span>
      <TextLines count={1} />
    </div>
  );
}

function OsmonGallery({ srcs }: { srcs: string[] }) {
  return (
    <div className="flex h-full flex-col items-center bg-[#f5ede0] px-2 pt-4">
      <span className="text-[12px] leading-none text-[#52839c]" style={OSMON_SCRIPT}>Fotogalereya</span>
      {srcs.length ? (
        <div className={`mt-2.5 grid w-full grid-cols-2 gap-1 rounded-[3px] ${HIGHLIGHT}`}>
          {srcs.slice(0, 6).map((src, i) => (
            <img key={`${src}-${i}`} src={src} alt="" className="aspect-[3/4] w-full rounded-[3px] object-cover" />
          ))}
        </div>
      ) : (
        <EmptySlot className="mt-2.5 h-24 w-full" />
      )}
    </div>
  );
}

function AnorHero({ src, names }: { src: string; names: { groom: string; bride: string } }) {
  return (
    <div className="flex h-full flex-col items-center bg-[#faf5ea] px-2 pt-5 text-center">
      <span className="text-[15px] font-bold leading-[0.9] text-[#b3242c]" style={{ fontFamily: '"Corinthia", cursive' }}>
        {names.groom}
        <br />
        <span className="text-[6px] font-semibold tracking-[0.2em] text-[#6e2323]" style={{ fontFamily: "Cormorant Garamond, serif" }}>va</span>
        <br />
        {names.bride}
      </span>
      {src ? (
        <img src={src} alt="" className={`mt-3 aspect-[4/3] w-[88%] rounded-[4px] object-cover ${HIGHLIGHT}`} />
      ) : (
        <EmptySlot className="mt-3 aspect-[4/3] w-[88%]" />
      )}
    </div>
  );
}

function FramedHero({ src, names, oval }: { src: string; names: { groom: string; bride: string }; oval: boolean }) {
  return (
    <div className={`flex h-full flex-col items-center px-2 pt-4 text-center ${oval ? "bg-[#fbf4e8]" : "bg-[#fff8f9]"}`}>
      <span
        className={`text-[14px] leading-[1.05] ${oval ? "text-[#8a3a1c]" : "text-[#8c2f4a]"}`}
        style={{ fontFamily: oval ? '"Pinyon Script", cursive' : '"Parisienne", cursive' }}
      >
        {names.groom}
        <br />& {names.bride}
      </span>
      <div
        className={`mt-3 w-[74%] overflow-hidden border-2 border-white shadow-md ${HIGHLIGHT} ${
          oval ? "aspect-[4/5] rounded-[50%]" : "aspect-[3/4] rounded-t-full rounded-b-md"
        }`}
      >
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <EmptySlot className="h-full w-full border-0" />}
      </div>
    </div>
  );
}

function BogGreeting({ src, heading }: { src: string; heading: string }) {
  return (
    <div className="flex h-full flex-col items-center bg-[#f0ece3] px-2 pt-4 text-center">
      <span className="text-[11px] leading-tight text-[#30401c]" style={{ fontFamily: '"Dancing Script", cursive' }}>
        {heading || "Aziz va qadrdon insonimiz!"}
      </span>
      <TextLines />
      <div className={`mt-2 aspect-[3/4] w-[66%] overflow-hidden rounded-t-full border-2 border-white shadow-md ${HIGHLIGHT}`}>
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <EmptySlot className="h-full w-full border-0" />}
      </div>
    </div>
  );
}

function TextLines({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-1.5 flex w-full flex-col items-center gap-[3px]">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="h-[2px] rounded-full bg-ink/15" style={{ width: `${80 - i * 14}%` }} />
      ))}
    </div>
  );
}

function EmptySlot({ className = "" }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-[4px] border border-dashed border-rose/50 bg-rose/5 ${HIGHLIGHT} ${className}`}>
      <span className="px-1 text-center text-[7px] font-semibold text-rose/70">rasmingiz shu yerda</span>
    </div>
  );
}
