import { ChangeEvent, useRef, useState } from "react";
import { ApiError, mediaUrl, uploadFile } from "../../lib/api";
import { PButton } from "../../platform/ui";

interface Props {
  kind: "image" | "audio";
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
}

export function UploadField({ kind, label, hint, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadFile(file));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Faylni yuklab bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
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
          <PButton type="button" variant="secondary" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
            {value ? "Almashtirish" : "Yuklash"}
          </PButton>
        </div>
      </div>

      {value && kind === "image" && (
        <img src={mediaUrl(value)} alt="" className="mt-4 max-h-56 w-full rounded-xl object-cover" />
      )}
      {value && kind === "audio" && <audio src={mediaUrl(value)} controls className="mt-4 w-full" />}
      {error && <p className="mt-3 text-xs text-rose">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={kind === "image" ? "image/jpeg,image/png,image/webp" : "audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a"}
        onChange={(e) => void onFile(e)}
      />
    </div>
  );
}
