import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, mediaUrl, uploadFile } from "../../lib/api";
import { adminApi } from "../../lib/adminAuth";
import { Notice, PButton, Spinner } from "../../platform/ui";
import { formatDateTime } from "../dashboard/shared";
import { titleFromFile } from "../builder/MusicPicker";
import { AUDIO_ACCEPT } from "../builder/UploadField";

type TrackStatus = "active" | "inactive";

interface AdminTrack {
  id: string;
  url: string;
  /** Qirqilmagan asl fayl — A:B shunga nisbatan */
  sourceUrl: string;
  trimStart: number | null;
  trimEnd: number | null;
  title: string;
  artist: string;
  durationSec: number;
  status: TrackStatus;
  builtIn: boolean;
  createdAt: string;
  usedBy: number;
  submittedBy: { name: string; email: string } | null;
}

const STATUS_TONE: Record<TrackStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  inactive: "border-ink/15 bg-ink/5 text-ink/60",
};

const MIN_TRIM_SEC = 1;
const input = "h-10 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm focus:border-rose/60 focus:outline-none";
const ghost = "h-9 rounded-lg px-3 text-xs font-semibold text-ink/60 ring-1 ring-ink/10 hover:text-ink disabled:opacity-50";

const pauseOtherAudio = (current: HTMLAudioElement) =>
  document.querySelectorAll("audio").forEach((a) => a !== current && a.pause());

/** 83.5 → "1:23.5" (o'ndan biri nol bo'lsa ko'rsatilmaydi). */
function formatTime(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const whole = Math.floor(tenths / 10);
  const rest = tenths % 10;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}${rest ? `.${rest}` : ""}`;
}

/** "1:23", "1:23.5" yoki "83" → soniya; noto'g'ri bo'lsa null. */
function parseTime(text: string): number | null {
  const match = /^(?:(\d+):)?(\d+(?:[.,]\d+)?)$/.exec(text.trim());
  if (!match) return null;
  const seconds = Number(match[2].replace(",", "."));
  if (match[1] !== undefined && seconds >= 60) return null;
  return Number(match[1] ?? 0) * 60 + seconds;
}

/** Saytga o'rnatilganlari ham, yuklanganlari ham: holati, nomi va [A:B] oralig'i. */
export function MusicTab() {
  const [status, setStatus] = useState("");
  const [tracks, setTracks] = useState<AdminTrack[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(null);
    adminApi<AdminTrack[]>(`/admin/music${status ? `?status=${status}` : ""}`)
      .then(setTracks)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, [status]);
  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Holat bo'yicha" className="h-11 rounded-xl border border-ink/15 bg-white px-3 text-sm">
          <option value="">Hammasi</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <PButton size="sm" onClick={() => fileRef.current?.click()}>
          + Musiqa qo'shish
        </PButton>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={AUDIO_ACCEPT}
          onChange={(e) => {
            setNewFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>

      {newFile && (
        <NewTrackForm
          key={`${newFile.name}-${newFile.lastModified}`}
          file={newFile}
          onCancel={() => setNewFile(null)}
          onDone={() => {
            setNewFile(null);
            load();
          }}
        />
      )}
      {error && <Notice>{error}</Notice>}

      {!tracks ? (
        <div className="flex justify-center py-10 text-ink/40"><Spinner className="h-6 w-6" /></div>
      ) : tracks.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/45">Bu holatda musiqa yo'q.</p>
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {tracks.map((track) => (
            // Qirqilgach yangi fayl: kartochka qaytadan chiziladi
            <TrackCard key={`${track.id}-${track.url}`} track={track} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Tanlangan faylni eshitib, nom berib qo'shish. Fayl faqat saqlanganda yuklanadi. */
function NewTrackForm({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: () => void }) {
  const [title, setTitle] = useState(() => titleFromFile(file.name));
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState(0);
  /** null — yuklanmayapti; 0..1 — yuborilgan qismi */
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState("");
  const busy = progress !== null;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const save = async () => {
    setProgress(0);
    setError(null);
    try {
      const url = await uploadFile(file, setProgress);
      await adminApi("/admin/music", { method: "POST", body: { url, title, artist, durationSec: duration } });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
      setProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-rose/30 bg-white p-4">
      <p className="text-sm font-semibold text-ink">Yangi musiqa</p>
      {src && (
        <audio
          controls
          src={src}
          className="mt-3 w-full"
          onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(Math.round(e.currentTarget.duration))}
          onPlay={(e) => pauseOtherAudio(e.currentTarget)}
        />
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Qo'shiq nomi" aria-label="Qo'shiq nomi" maxLength={120} className={input} />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ijrochi (ixtiyoriy)" aria-label="Ijrochi" maxLength={120} className={input} />
      </div>
      <p className="mt-2 text-xs text-ink/45">Qo'shilgach, kerakli qismini «Qirqish» bilan tanlashingiz mumkin.</p>
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}
      {progress !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-rose transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <PButton size="sm" loading={busy} disabled={!title.trim()} onClick={() => void save()}>
          {progress === null ? "Qo'shish" : progress < 1 ? `Yuklanmoqda ${Math.round(progress * 100)}%` : "Saqlanmoqda..."}
        </PButton>
        <PButton size="sm" variant="secondary" disabled={busy} onClick={onCancel}>
          Bekor qilish
        </PButton>
      </div>
    </div>
  );
}

function TrackCard({ track, onDone }: { track: AdminTrack; onDone: () => void }) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trimming, setTrimming] = useState(false);
  const edited = title !== track.title || artist !== track.artist;
  const trimmed = track.trimStart !== null && track.trimEnd !== null;

  const save = async (status?: TrackStatus) => {
    setBusy(true);
    setError(null);
    try {
      await adminApi(`/admin/music/${track.id}`, { method: "PATCH", body: { title, artist, ...(status ? { status } : {}) } });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`«${title || "Nomsiz"}» butunlay o'chirilsinmi? Fayl ham o'chadi.`)) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi(`/admin/music/${track.id}`, { method: "DELETE" });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
      setBusy(false);
    }
  };

  return (
    <div data-track={track.title} className={`rounded-2xl border border-ink/10 bg-white p-4 ${busy ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <select
          aria-label="Holat"
          value={track.status}
          disabled={busy}
          onChange={(e) => void save(e.target.value as TrackStatus)}
          className={`h-8 rounded-lg border px-2 text-xs font-semibold ${STATUS_TONE[track.status]}`}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="min-w-0 truncate text-xs text-ink/45">
          {track.builtIn ? "Taklifnomaniki" : `${track.submittedBy?.email ?? "Admin yuklagan"} · ${formatDateTime(track.createdAt)}`}
        </span>
      </div>

      {!trimming && (
        <audio controls preload="metadata" src={mediaUrl(track.url)} className="mt-3 w-full" onPlay={(e) => pauseOtherAudio(e.currentTarget)} />
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Qo'shiq nomi" aria-label="Qo'shiq nomi" maxLength={120} className={input} />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ijrochi (ixtiyoriy)" aria-label="Ijrochi" maxLength={120} className={input} />
      </div>
      <p className="mt-2 text-xs text-ink/45">
        {track.usedBy} ta taklifnomada ishlatilmoqda
        {track.durationSec > 0 && ` · ${formatTime(track.durationSec)}`}
        {trimmed && ` · qirqilgan: ${formatTime(track.trimStart!)} – ${formatTime(track.trimEnd!)}`}
      </p>
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {edited && (
          <button disabled={busy} onClick={() => void save()} className="h-9 rounded-lg bg-ink px-3 text-xs font-semibold text-ivory hover:bg-ink/85 disabled:opacity-50">
            Saqlash
          </button>
        )}
        <button disabled={busy} onClick={() => setTrimming((v) => !v)} aria-expanded={trimming} className={ghost}>
          {trimming ? "Yopish" : "✂ Qirqish"}
        </button>
        {!track.builtIn && (
          <button
            disabled={busy}
            onClick={() => void remove()}
            className="ml-auto h-9 rounded-lg px-3 text-xs font-semibold text-rose ring-1 ring-rose/25 hover:bg-rose hover:text-white disabled:opacity-50"
          >
            O'chirish
          </button>
        )}
      </div>

      {trimming && <TrimPanel track={track} onDone={onDone} />}
    </div>
  );
}

/** Vaqt maydoni: yozish paytida erkin matn, chiqqanda yoki Enter'da qo'llanadi. */
function TimeField({ label, value, onCommit }: { label: string; value: number; onCommit: (seconds: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    const parsed = text === null ? null : parseTime(text);
    if (parsed !== null) onCommit(parsed);
    setText(null);
  };
  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={text ?? formatTime(value)}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="h-9 w-20 rounded-lg border border-ink/15 bg-white px-2 text-center font-mono text-sm focus:border-rose/60 focus:outline-none"
    />
  );
}

/**
 * [A:B] tanlash. Doim asl faylni ko'rsatadi: oldin qirqilgan bo'lsa ham oraliqni
 * kengaytirish mumkin. Saqlaganda server shu qismni yangi faylga qirqadi.
 */
function TrimPanel({ track, onDone }: { track: AdminTrack; onDone: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAtRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(track.trimStart ?? 0);
  const [end, setEnd] = useState(track.trimEnd ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = track.trimStart !== null;
  const whole = start === 0 && end >= duration;
  const unchanged = trimmed ? start === track.trimStart && end === track.trimEnd : whole;

  const setA = (value: number) => setStart(Math.min(Math.max(0, value), Math.max(0, end - MIN_TRIM_SEC)));
  const setB = (value: number) => setEnd(Math.max(Math.min(duration, value), Math.min(duration, start + MIN_TRIM_SEC)));
  const now = () => Math.round((audioRef.current?.currentTime ?? 0) * 10) / 10;

  const playRange = () => {
    const audio = audioRef.current;
    if (!audio) return;
    pauseOtherAudio(audio);
    stopAtRef.current = end;
    audio.currentTime = start;
    void audio.play();
  };

  const send = async (body: { start: number; end: number } | { reset: true }) => {
    setBusy(true);
    setError(null);
    audioRef.current?.pause();
    try {
      await adminApi(`/admin/music/${track.id}/trim`, { method: "POST", body });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Qirqib bo'lmadi");
      setBusy(false);
    }
  };

  const percent = (value: number) => (duration ? (value / duration) * 100 : 0);

  return (
    <div className="mt-3 rounded-xl bg-sand/50 p-3">
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={mediaUrl(track.sourceUrl)}
        className="w-full"
        onLoadedMetadata={(e) => {
          const total = Math.round(e.currentTarget.duration * 10) / 10;
          if (!Number.isFinite(total)) return;
          setDuration(total);
          setEnd((value) => (value > 0 ? Math.min(value, total) : total));
        }}
        onTimeUpdate={(e) => {
          if (stopAtRef.current !== null && e.currentTarget.currentTime >= stopAtRef.current) {
            stopAtRef.current = null;
            e.currentTarget.pause();
          }
        }}
        // Odam o'zi boshqarsa, B da to'xtatmaymiz
        onSeeking={(e) => {
          if (stopAtRef.current !== null && Math.abs(e.currentTarget.currentTime - start) > 0.5) stopAtRef.current = null;
        }}
      />

      {duration === 0 ? (
        <p className="mt-3 text-xs text-ink/50">Musiqa yuklanmoqda...</p>
      ) : (
        <>
          <div className="relative mt-3 h-2 rounded-full bg-ink/10" aria-hidden="true">
            <div className="absolute inset-y-0 rounded-full bg-rose" style={{ left: `${percent(start)}%`, right: `${100 - percent(end)}%` }} />
          </div>

          {(
            [
              { name: "A", label: "Boshlanishi", value: start, set: setA },
              { name: "B", label: "Tugashi", value: end, set: setB },
            ] as const
          ).map(({ name, label, value, set }) => (
            <div key={name} className="mt-3 flex flex-wrap items-center gap-2">
              <span className="w-5 text-sm font-bold text-ink">{name}</span>
              <input
                type="range"
                aria-label={`${name} — ${label}`}
                min={0}
                max={duration}
                step={0.1}
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="min-w-[8rem] flex-1 accent-rose"
              />
              <TimeField label={`${name} vaqti`} value={value} onCommit={set} />
              <button type="button" onClick={() => set(now())} className={ghost} title="Pleyer turgan joyni olish">
                Hozirgi joy
              </button>
            </div>
          ))}

          <p className="mt-3 text-xs text-ink/55">
            Tanlangan qism: <b className="text-ink">{formatTime(Math.max(0, end - start))}</b> (to'liq uzunligi {formatTime(duration)})
            {track.usedBy > 0 && `. Saqlasangiz, ${track.usedBy} ta taklifnomada ham shu qism chalinadi.`}
          </p>
          {error && <p className="mt-2 text-xs text-rose">{error}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={playRange} className={ghost}>▶ Tanlangan qismni eshitish</button>
            <button
              type="button"
              disabled={busy || unchanged}
              onClick={() => void send({ start, end })}
              className="h-9 rounded-lg bg-ink px-3 text-xs font-semibold text-ivory hover:bg-ink/85 disabled:opacity-50"
            >
              {busy ? "Qirqilmoqda..." : "Qirqishni saqlash"}
            </button>
            {trimmed && (
              <button type="button" disabled={busy} onClick={() => void send({ reset: true })} className={ghost}>
                Asl holiga qaytarish
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
