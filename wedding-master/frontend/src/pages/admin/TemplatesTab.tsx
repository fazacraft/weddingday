import { useEffect, useState } from "react";
import { api, ApiError, mediaUrl, PHOTO_WIDTHS } from "../../lib/api";
import { adminApi } from "../../lib/adminAuth";
import { withBase } from "../../lib/base";
import { MUSIC_LIBRARY } from "../../lib/music";
import {
  getTemplateSettings,
  setTemplateSettings,
  TEMPLATE_TEXT_KEYS,
  useTemplateSettings,
  type TemplateSettings,
  type TemplateSettingsMap,
  type TemplateTextKey,
} from "../../lib/templateSettings";
import { OSMON_SAMPLES } from "../../templates/osmon/photos";
import { TEMPLATES, type TemplateMeta } from "../../templates/registry";
import { EMPTY_INVITATION, GALLERY_MAX, type TemplateKey } from "../../types/invitation";
import { Notice, PButton, Spinner } from "../../platform/ui";
import { AUDIO_ACCEPT, useUpload } from "../builder/UploadField";

/*
 * Shablon standartlari: matnlar (yangi taklifnoma va namuna sahifasi uchun),
 * fon musiqasi va "Osmon"ning namuna rasmlari (o'z musiqasi/rasmi yo'q barcha
 * taklifnomalarda darhol almashadi). Bo'sh maydon — kodda o'rnatilgan standart.
 */

interface SharedTrack {
  url: string;
  title: string;
  artist: string;
}

interface Form {
  texts: Record<TemplateTextKey, string>;
  music: string;
  photos: { cover: string; couple: string; venue: string; gallery: string[] };
}

const TEXT_FIELDS: Record<TemplateTextKey, { label: string; multiline?: boolean }> = {
  eventTitle: { label: "Tadbir nomi" },
  inviteText: { label: "Taklif jumlasi" },
  greetingHeading: { label: "Murojaat sarlavhasi" },
  greetingMessage: { label: "Murojaat matni", multiline: true },
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

function toForm(saved: TemplateSettings | undefined): Form {
  return {
    texts: Object.fromEntries(TEMPLATE_TEXT_KEYS.map((k) => [k, saved?.texts?.[k] ?? ""])) as Form["texts"],
    music: saved?.music ?? "",
    photos: {
      cover: saved?.photos?.cover ?? "",
      couple: saved?.photos?.couple ?? "",
      venue: saved?.photos?.venue ?? "",
      gallery: saved?.photos?.gallery ?? [],
    },
  };
}

export function TemplatesTab() {
  const settings = useTemplateSettings();
  const [loaded, setLoaded] = useState(false);
  const [shared, setShared] = useState<SharedTrack[]>([]);
  const [active, setActive] = useState<TemplateKey>("osmon");

  // Admin har doim eng so'nggi holatni tahrirlasin (sahifa HTML'idagisi eskirgan bo'lishi mumkin)
  useEffect(() => {
    api<TemplateSettingsMap>("/templates/settings", { token: "" })
      .then(setTemplateSettings)
      .catch(() => {})
      .finally(() => setLoaded(true));
    api<SharedTrack[]>("/music").then(setShared).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-ink/60">
        <b className="text-ink">Musiqa va rasmlar</b> o'z musiqasi yoki rasmi yo'q barcha taklifnomalarda darhol almashadi.{" "}
        <b className="text-ink">Matnlar</b> yangi taklifnomalarda va namuna sahifasida chiqadi — mavjud taklifnomalar o'z
        matnini saqlab qoladi. Bo'sh qoldirilgan maydon — standart qiymat.
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.values(TEMPLATES).map((tpl) => (
          <button
            key={tpl.key}
            type="button"
            onClick={() => setActive(tpl.key)}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
              active === tpl.key ? "bg-ink text-ivory" : "text-ink/60 ring-1 ring-ink/15 hover:text-ink"
            }`}
          >
            {tpl.name}
            {tpl.hidden && <span className="ml-1 text-[11px] font-normal opacity-60">(yashirin)</span>}
            {settings[tpl.key] && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose align-middle" />}
          </button>
        ))}
      </div>
      {!loaded ? (
        <div className="flex justify-center py-10 text-ink/40"><Spinner className="h-6 w-6" /></div>
      ) : (
        <TemplateEditor key={active} tpl={TEMPLATES[active]} saved={settings[active]} shared={shared} />
      )}
    </div>
  );
}

function TemplateEditor({ tpl, saved, shared }: { tpl: TemplateMeta; saved?: TemplateSettings; shared: SharedTrack[] }) {
  const [form, setForm] = useState<Form>(() => toForm(saved));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(saved));

  const patch = (next: Partial<Form>) => {
    setForm((f) => ({ ...f, ...next }));
    setDone(false);
  };
  const setPhoto = (key: keyof Form["photos"], value: string | string[]) => patch({ photos: { ...form.photos, [key]: value } });

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await adminApi<TemplateSettings>(`/admin/templates/${tpl.key}`, { method: "PUT", body: form });
      const empty = Object.keys(result).length === 0;
      const next = { ...getTemplateSettings() };
      if (empty) delete next[tpl.key];
      else next[tpl.key] = result;
      setTemplateSettings(next);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-ink/10 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold text-ink">{tpl.name}</p>
          <p className="text-xs text-ink/50">{tpl.tagline}</p>
        </div>
        {!tpl.hidden && (
          <a
            href={withBase(`/shablonlar/${tpl.key}`)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-rose hover:text-rose-dark"
          >
            Namunani ko'rish ↗
          </a>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">Matnlar</h3>
        {TEMPLATE_TEXT_KEYS.map((key) => {
          const field = TEXT_FIELDS[key];
          const common = {
            value: form.texts[key],
            placeholder: EMPTY_INVITATION[key],
            onChange: (e: { target: { value: string } }) => patch({ texts: { ...form.texts, [key]: e.target.value } }),
            className: "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm placeholder:text-ink/35",
          };
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink/70">
                {field.label}
                {!form.texts[key] && <span className="ml-1.5 font-normal text-ink/40">— standart</span>}
              </span>
              {field.multiline ? <textarea rows={5} {...common} /> : <input {...common} />}
            </label>
          );
        })}
      </section>

      <MusicSection tpl={tpl} value={form.music} shared={shared} onChange={(music) => patch({ music })} />

      {tpl.key === "osmon" && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">Namuna rasmlar</h3>
          <p className="-mt-1 text-xs text-ink/50">Juftlik o'z rasmini yuklamaguncha taklifnomada shular turadi.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <PhotoSlot label="Muqova (hero)" value={form.photos.cover} builtIn={OSMON_SAMPLES.cover} onChange={(v) => setPhoto("cover", v)} />
            <PhotoSlot label="Juftlik kartasi" value={form.photos.couple} builtIn={OSMON_SAMPLES.couple} onChange={(v) => setPhoto("couple", v)} />
            <PhotoSlot label="To'yxona" value={form.photos.venue} builtIn={OSMON_SAMPLES.venue} onChange={(v) => setPhoto("venue", v)} />
          </div>
          <GallerySlot value={form.photos.gallery} builtIn={OSMON_SAMPLES.gallery} onChange={(v) => setPhoto("gallery", v)} />
        </section>
      )}

      {error && <Notice>{error}</Notice>}
      {done && !dirty && <Notice tone="success">Saqlandi — saytda darhol ko'rinadi.</Notice>}
      <div className="flex flex-wrap gap-3">
        <PButton onClick={() => void save()} loading={busy} disabled={!dirty}>
          Saqlash
        </PButton>
        <PButton variant="secondary" disabled={!dirty || busy} onClick={() => patch(toForm(saved))}>
          Bekor qilish
        </PButton>
        <PButton
          variant="secondary"
          disabled={busy || JSON.stringify(form) === JSON.stringify(toForm(undefined))}
          onClick={() => patch(toForm(undefined))}
        >
          Hammasini standartga qaytarish
        </PButton>
      </div>
    </div>
  );
}

function MusicSection({
  tpl,
  value,
  shared,
  onChange,
}: {
  tpl: TemplateMeta;
  value: string;
  shared: SharedTrack[];
  onChange: (url: string) => void;
}) {
  const { inputRef, busy, error, onFiles, pick } = useUpload(([url]) => onChange(url));
  const builtIn = MUSIC_LIBRARY.find((t) => withBase(t.url) === tpl.defaultMusic)?.title ?? "shablonning o'z kuyi";
  const known = value === "" || shared.some((t) => t.url === value);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">Fon musiqasi</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 text-sm"
        >
          <option value="">Standart: {builtIn}</option>
          {shared.map((t) => (
            <option key={t.url} value={t.url}>{t.title}{t.artist ? ` — ${t.artist}` : ""}</option>
          ))}
          {!known && <option value={value}>Yuklangan fayl</option>}
        </select>
        <PButton variant="secondary" size="sm" loading={busy} onClick={pick}>
          MP3 yuklash
        </PButton>
        <input ref={inputRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={(e) => void onFiles(e)} />
      </div>
      <audio key={value} controls preload="none" src={value ? mediaUrl(value) : tpl.defaultMusic} className="w-full" />
      {error && <Notice>{error}</Notice>}
    </section>
  );
}

function PhotoSlot({ label, value, builtIn, onChange }: { label: string; value: string; builtIn: string; onChange: (url: string) => void }) {
  const { inputRef, busy, error, onFiles, pick } = useUpload(([url]) => onChange(url));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-ink/70">
        {label}
        {!value && <span className="ml-1.5 font-normal text-ink/40">— standart</span>}
      </span>
      <img src={mediaUrl(value || builtIn, PHOTO_WIDTHS.thumb)} alt={label} className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-ink/10" />
      <div className="flex gap-2">
        <PButton variant="secondary" size="sm" loading={busy} onClick={pick}>
          Almashtirish
        </PButton>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-ink/50 hover:text-ink">
            Standartga qaytarish
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => void onFiles(e)} />
      {error && <Notice>{error}</Notice>}
    </div>
  );
}

function GallerySlot({ value, builtIn, onChange }: { value: string[]; builtIn: string[]; onChange: (urls: string[]) => void }) {
  const { inputRef, busy, error, onFiles, pick } = useUpload((urls) => onChange([...value, ...urls].slice(0, GALLERY_MAX)));
  const custom = value.length > 0;
  const shown = custom ? value : builtIn;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-ink/70">
        Galereya ({shown.length}/{GALLERY_MAX})
        {!custom && <span className="ml-1.5 font-normal text-ink/40">— standart</span>}
      </span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {shown.map((src, i) => (
          <div key={`${src}-${i}`} className="relative">
            <img src={mediaUrl(src, PHOTO_WIDTHS.thumb)} alt={`Galereya ${i + 1}`} className="aspect-square w-full rounded-lg object-cover ring-1 ring-ink/10" />
            {custom && (
              <button
                type="button"
                aria-label="Olib tashlash"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-xs text-ivory hover:bg-ink"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {(!custom || value.length < GALLERY_MAX) && (
          <PButton variant="secondary" size="sm" loading={busy} onClick={pick}>
            {custom ? "+ Rasm qo'shish" : "O'z rasmlarim bilan almashtirish"}
          </PButton>
        )}
        {custom && (
          <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-ink/50 hover:text-ink">
            Standartga qaytarish
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple className="hidden" onChange={(e) => void onFiles(e)} />
      {error && <Notice>{error}</Notice>}
    </div>
  );
}
