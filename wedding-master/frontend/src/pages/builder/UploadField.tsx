import { ChangeEvent, ReactNode, useRef, useState } from "react";
import { ApiError, mediaUrl, PHOTO_WIDTHS, uploadFile } from "../../lib/api";
import { PButton } from "../../platform/ui";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const AUDIO_ACCEPT = "audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a";

/**
 * Tanlangan fayllarni ketma-ket yuklaydi; yuklash holati va xatoni boshqaradi.
 * onUploaded'ga yuklangan manzillar va ularga mos fayllar (muvaffaqiyatlilari) beriladi.
 */
export function useUpload(onUploaded: (urls: string[], files: File[]) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    const urls: string[] = [];
    const uploaded: File[] = [];
    try {
      for (const file of files) {
        urls.push(await uploadFile(file));
        uploaded.push(file);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Faylni yuklab bo'lmadi");
    } finally {
      // Xato bo'lsa ham, muvaffaqiyatli yuklanganlari saqlanadi
      if (urls.length) onUploaded(urls, uploaded);
      setBusy(false);
    }
  };

  return { inputRef, busy, error, onFiles, pick: () => inputRef.current?.click() };
}

interface Props {
  kind: "image" | "audio";
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  /** Rasm taklifnomada qayerda chiqishini ko'rsatuvchi blok (oddiy rasm ko'rinishi o'rniga) */
  placement?: ReactNode;
  /** Maydon ustiga kelinganda yoki fokuslanganda */
  onActivate?: () => void;
}

export function UploadField({ kind, label, hint, value, onChange, placement, onActivate }: Props) {
  const { inputRef, busy, error, onFiles, pick } = useUpload(([url]) => onChange(url));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4" onMouseEnter={onActivate} onFocusCapture={onActivate}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{hint}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {value && (
            <PButton type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              O'chirish
            </PButton>
          )}
          <PButton type="button" variant="secondary" size="sm" loading={busy} onClick={pick}>
            {value ? "Almashtirish" : "Yuklash"}
          </PButton>
        </div>
      </div>

      {placement}
      {!placement && value && kind === "image" && (
        <img src={mediaUrl(value, PHOTO_WIDTHS.card)} alt="" className="mt-4 max-h-56 w-full rounded-xl object-cover" />
      )}
      {value && kind === "audio" && <audio src={mediaUrl(value)} controls className="mt-4 w-full" />}
      {error && <p className="mt-3 text-xs text-rose">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={kind === "image" ? IMAGE_ACCEPT : AUDIO_ACCEPT}
        onChange={(e) => void onFiles(e)}
      />
    </div>
  );
}

interface GalleryProps {
  label: string;
  hint: string;
  value: string[];
  max: number;
  onChange: (urls: string[]) => void;
  placement?: ReactNode;
  onActivate?: () => void;
}

/** Bir nechta rasmli galereya: bir yo'la bir nechta fayl tanlash mumkin. */
export function GalleryField({ label, hint, value, max, onChange, placement, onActivate }: GalleryProps) {
  // Yuklash davomida boshqa o'zgarish bo'lsa ham, eng so'nggi ro'yxatga qo'shamiz
  const latest = useRef(value);
  latest.current = value;
  const { inputRef, busy, error, onFiles, pick } = useUpload((urls) =>
    onChange([...latest.current, ...urls].slice(0, max))
  );
  const full = value.length >= max;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4" onMouseEnter={onActivate} onFocusCapture={onActivate}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">
            {label} <span className="font-normal text-ink/40">· {value.length}/{max}</span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{hint}</p>
        </div>
        {!full && (
          <PButton type="button" variant="secondary" size="sm" loading={busy} onClick={pick} className="shrink-0">
            Qo'shish
          </PButton>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-sand">
              <img src={mediaUrl(url, PHOTO_WIDTHS.thumb)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink/70 text-sm text-white hover:bg-ink"
                aria-label={`${i + 1}-rasmni o'chirish`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-3 text-xs text-rose">{error}</p>}
      {placement}

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={IMAGE_ACCEPT}
        onChange={(e) => void onFiles(e)}
      />
    </div>
  );
}
