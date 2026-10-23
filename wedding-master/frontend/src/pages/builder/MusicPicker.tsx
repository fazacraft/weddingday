import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../../lib/api";
import { withBase } from "../../lib/base";
import { MUSIC_LIBRARY } from "../../lib/music";
import { TEMPLATES } from "../../templates/registry";
import type { InvitationData } from "../../types/invitation";
import { PButton } from "../../platform/ui";
import { AUDIO_ACCEPT, useUpload } from "./UploadField";

interface Option {
  /** musicUrl'ga yoziladigan qiymat ("" — shablonning o'z musiqasi) */
  value: string;
  src: string;
  title: string;
  note: string;
  duration?: string;
}

/** Bir vaqtda bitta musiqani chaladi; qadamdan chiqilganda to'xtaydi. */
function usePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => () => audioRef.current?.pause(), []);

  /** id — qator kaliti: bir xil fayl ikki qatorda bo'lsa ham faqat bosilgani "chalinmoqda" bo'ladi */
  const toggle = (id: string, src: string) => {
    let audio = audioRef.current;
    if (!audio) {
      const created = new Audio();
      created.addEventListener("timeupdate", () =>
        setProgress(created.duration ? created.currentTime / created.duration : 0)
      );
      created.addEventListener("ended", () => setCurrent(null));
      audioRef.current = created;
      audio = created;
    }
    if (current === id && !audio.paused) {
      audio.pause();
      setCurrent(null);
      return;
    }
    audio.src = src;
    setProgress(0);
    setCurrent(id);
    audio.play().catch(() => setCurrent(null));
  };

  return { current, progress, toggle };
}

/** "Fon musiqasi": kutubxonadan eshitib ko'rib tanlash yoki o'z faylini yuklash. */
export function MusicPicker({ data, update }: { data: InvitationData; update: (patch: Partial<InvitationData>) => void }) {
  const { current, progress, toggle } = usePlayer();
  const { inputRef, busy, error, onFiles, pick } = useUpload(([url]) => update({ musicUrl: url }));

  const template = TEMPLATES[data.template] ?? TEMPLATES.bog;
  const templateTrack = MUSIC_LIBRARY.find((t) => withBase(t.url) === template.defaultMusic);
  const custom = data.musicUrl.startsWith("/uploads/") ? data.musicUrl : "";

  const options: Option[] = [
    {
      value: "",
      src: template.defaultMusic,
      title: "Shablon musiqasi",
      note: templateTrack ? `«${template.name}»: ${templateTrack.title}` : `«${template.name}» shablonining o'z kuyi`,
      duration: templateTrack?.duration,
    },
    ...MUSIC_LIBRARY.map((t) => ({ value: t.url, src: mediaUrl(t.url), title: t.title, note: t.note, duration: t.duration })),
    ...(custom ? [{ value: custom, src: mediaUrl(custom), title: "O'zingiz yuklagan musiqa", note: "Faqat sizning taklifnomangizda" }] : []),
  ];

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <p className="text-sm font-semibold text-ink">Fon musiqasi</p>
      <p className="mt-0.5 text-xs leading-relaxed text-ink/50">
        ▶ bilan eshitib ko'ring va tanlang. Mehmon konvertni ochganda chalinadi.
      </p>

      <ul className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Fon musiqasi">
        {options.map((opt) => {
          const id = opt.value || "template";
          const selected = data.musicUrl === opt.value;
          const playing = current === id;
          return (
            <li
              key={id}
              className={`flex items-center gap-3 rounded-xl border p-2 pr-3 transition-colors ${
                selected ? "border-rose bg-rose/5" : "border-ink/10 hover:border-ink/25"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(id, opt.src)}
                aria-label={playing ? `${opt.title} — to'xtatish` : `${opt.title} — eshitish`}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
                  playing ? "bg-rose text-white" : "bg-sand text-ink hover:bg-sand/70"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  {playing ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /> : <path d="M8 5v14l11-7z" />}
                </svg>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update({ musicUrl: opt.value })}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{opt.title}</span>
                  <span className="block truncate text-xs text-ink/50">{opt.note}</span>
                  {playing && (
                    <span className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-ink/10">
                      <span className="block h-full bg-rose transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
                    </span>
                  )}
                </span>
                {opt.duration && <span className="shrink-0 text-xs tabular-nums text-ink/40">{opt.duration}</span>}
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs ${
                    selected ? "border-rose bg-rose text-white" : "border-ink/20"
                  }`}
                  aria-hidden="true"
                >
                  {selected && "✓"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PButton type="button" variant="secondary" size="sm" loading={busy} onClick={pick}>
          {custom ? "Boshqa fayl yuklash" : "＋ O'z musiqangizni yuklash"}
        </PButton>
        <span className="text-xs text-ink/40">MP3 yoki M4A, 12MB gacha</span>
      </div>
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}

      <input ref={inputRef} type="file" hidden accept={AUDIO_ACCEPT} onChange={(e) => void onFiles(e)} />
    </div>
  );
}
