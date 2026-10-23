import { Link } from "react-router-dom";
import { GALLERY_MAX, type InvitationData } from "../../types/invitation";
import { TEMPLATE_LIST, TEMPLATES } from "../../templates/registry";
import { TemplateThumb } from "../../platform/TemplateThumb";
import { Area, Field, Toggle } from "../../platform/ui";
import { GalleryField, UploadField } from "./UploadField";
import { PhotoPlacement } from "./PhotoPlacement";
import { MusicPicker } from "./MusicPicker";
import { focusPreviewSlot, type PhotoSlot } from "../../lib/previewFocus";
import { SlugField, type SlugStatus } from "./SlugField";

export interface StepProps {
  data: InvitationData;
  update: (patch: Partial<InvitationData>) => void;
}

const EVENT_TITLES = ["Nikoh to'yi", "Fotiha to'yi", "Kelin salom", "Qiz bazmi", "Sunnat to'yi"];
const UZ_WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];

export function NamesStep({ data, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kuyov ismi" placeholder="Mirodil" value={data.groomName} onChange={(e) => update({ groomName: e.target.value })} autoFocus />
        <Field label="Kelin ismi" placeholder="Jasmina" value={data.brideName} onChange={(e) => update({ brideName: e.target.value })} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-ink/80">Tadbir turi</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TITLES.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => update({ eventTitle: title })}
              className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
                data.eventTitle === title ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white text-ink/70 hover:border-ink/40"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
        <Field
          label="Yoki o'zingiz yozing"
          value={data.eventTitle}
          onChange={(e) => update({ eventTitle: e.target.value })}
          placeholder="Nikoh to'yi"
        />
      </div>

      {(data.groomName || data.brideName) && (
        <div className="rounded-2xl bg-sand/60 px-5 py-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/40">taklifnomada shunday chiqadi</p>
          <p className="mt-2 font-display text-4xl font-semibold text-ink">
            {data.groomName || "Kuyov"} <span className="text-rose">&</span> {data.brideName || "Kelin"}
          </p>
        </div>
      )}
    </div>
  );
}

export function DateStep({ data, update }: StepProps) {
  const [y, m, d] = data.date.split("-").map(Number);
  const weekday = y && m && d ? UZ_WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] : null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="To'y sanasi" type="date" min={today} value={data.date} onChange={(e) => update({ date: e.target.value })} />
        <Field
          label="Boshlanish vaqti"
          type="time"
          value={data.time}
          onChange={(e) => update({ time: e.target.value })}
          hint="Toshkent vaqti bo'yicha"
        />
      </div>
      {weekday && (
        <div className="rounded-2xl bg-sand/60 px-5 py-4 text-sm text-ink/70">
          📅 To'y kuni — <b className="text-ink">{weekday}</b>, soat <b className="text-ink">{data.time}</b>. Taklifnomada
          kalendar va orqaga sanoq shu sana bo'yicha chiqadi.
        </div>
      )}
    </div>
  );
}

export function VenueStep({ data, update }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="To'yxona nomi" placeholder="Atlas to'yxonasi" value={data.venueName} onChange={(e) => update({ venueName: e.target.value })} />
      <Field label="Manzil" placeholder="Toshkent shahri, Yunusobod tumani" value={data.venueAddress} onChange={(e) => update({ venueAddress: e.target.value })} optional />
      <Field label="Mo'ljal" placeholder="Metro yonida" value={data.venueLandmark} onChange={(e) => update({ venueLandmark: e.target.value })} optional />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Google Maps havolasi"
          type="url"
          placeholder="https://maps.google.com/..."
          value={data.googleMapUrl}
          onChange={(e) => update({ googleMapUrl: e.target.value.trim() })}
          optional
        />
        <Field
          label="Yandex xarita havolasi"
          type="url"
          placeholder="https://yandex.uz/maps/..."
          value={data.yandexMapUrl}
          onChange={(e) => update({ yandexMapUrl: e.target.value.trim() })}
          optional
        />
      </div>
      <p className="text-xs leading-relaxed text-ink/50">
        Havolani olish: xarita ilovasida to'yxonani toping → <b>Ulashish</b> → <b>Havolani nusxalash</b>.
      </p>
    </div>
  );
}

export function DetailsStep({ data, update }: StepProps) {
  const setItem = (i: number, patch: Partial<{ time: string; title: string }>) =>
    update({ schedule: data.schedule.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });

  return (
    <div className="flex flex-col gap-5">
      <Field label="Taklif jumlasi" value={data.inviteText} onChange={(e) => update({ inviteText: e.target.value })} hint="Bosh sahifada ismlar ostida chiqadi" />
      <Field label="Murojaat sarlavhasi" value={data.greetingHeading} onChange={(e) => update({ greetingHeading: e.target.value })} />
      <Area
        label="Taklif matni"
        value={data.greetingMessage}
        onChange={(e) => update({ greetingMessage: e.target.value })}
        hint="Bo'sh qator qoldirsangiz, yangi paragraf boshlanadi"
        rows={6}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-ink/80">
            To'y dasturi <span className="ml-1 font-normal text-ink/40">ixtiyoriy</span>
          </p>
          <span className="text-xs text-ink/40">vaqt bo'yicha saralanadi</span>
        </div>
        {data.schedule.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="time"
              value={item.time}
              onChange={(e) => setItem(i, { time: e.target.value })}
              className="h-11 w-28 shrink-0 rounded-xl border border-ink/15 bg-white px-3 text-sm focus:border-rose/60 focus:outline-none"
              aria-label="Vaqt"
            />
            <input
              value={item.title}
              onChange={(e) => setItem(i, { title: e.target.value })}
              placeholder="Kelin-kuyov kirib kelishi"
              className="h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 text-sm focus:border-rose/60 focus:outline-none"
              aria-label="Tadbir"
            />
            <button
              type="button"
              onClick={() => update({ schedule: data.schedule.filter((_, idx) => idx !== i) })}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/40 hover:bg-rose/5 hover:text-rose"
              aria-label="O'chirish"
            >
              ✕
            </button>
          </div>
        ))}
        {data.schedule.length < 12 && (
          <button
            type="button"
            onClick={() => update({ schedule: [...data.schedule, { time: data.schedule[data.schedule.length - 1]?.time || data.time, title: "" }] })}
            className="h-11 rounded-xl border border-dashed border-ink/20 text-sm font-semibold text-ink/60 hover:border-ink/40 hover:text-ink"
          >
            + Band qo'shish
          </button>
        )}
      </div>

      <Field label="Kiyim kodi" placeholder="Milliy kiyim" value={data.dressCode} onChange={(e) => update({ dressCode: e.target.value })} optional />
    </div>
  );
}

export function MediaStep({ data, update }: StepProps) {
  // Rasm yangilangach jonli ko'rinish (iframe) qoralamani o'qib ulgurishi uchun biroz kutamiz
  const updatePhoto = (patch: Partial<InvitationData>, slot: PhotoSlot) => {
    update(patch);
    window.setTimeout(() => focusPreviewSlot(slot), 350);
  };

  return (
    <div className="flex flex-col gap-4">
      <UploadField
        kind="image"
        label="Kelin-kuyov surati"
        hint="JPG, PNG yoki WEBP, 12MB gacha."
        value={data.couplePhoto}
        onChange={(couplePhoto) => updatePhoto({ couplePhoto }, "couple")}
        onActivate={() => focusPreviewSlot("couple")}
        placement={<PhotoPlacement slot="couple" data={data} />}
      />
      <MusicPicker data={data} update={update} />

      <div className="mt-4 border-t border-ink/10 pt-6">
        <p className="text-sm font-semibold text-ink">Qo'shimcha rasmlar</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/50">
          Hozircha «Osmon» shablonida chiqadi. Hech qanday rasm yuklamasangiz, shablonning namunaviy rasmlari ko'rinadi.
        </p>
      </div>
      <UploadField
        kind="image"
        label="Muqova rasmi"
        hint="Birinchi ekranning foni — ismlar va sana uning ustida yoziladi. Yuklamasangiz, kelin-kuyov surati ishlatiladi."
        value={data.coverPhoto}
        onChange={(coverPhoto) => updatePhoto({ coverPhoto }, "cover")}
        onActivate={() => focusPreviewSlot("cover")}
        placement={<PhotoPlacement slot="cover" data={data} />}
      />
      <UploadField
        kind="image"
        label="To'yxona rasmi"
        hint="«To'y maskani» bo'limida manzil ustida chiqadi."
        value={data.venuePhoto}
        onChange={(venuePhoto) => updatePhoto({ venuePhoto }, "venue")}
        onActivate={() => focusPreviewSlot("venue")}
        placement={<PhotoPlacement slot="venue" data={data} />}
      />
      <GalleryField
        label="Fotogalereya"
        hint={`${GALLERY_MAX} tagacha rasm, bir yo'la bir nechtasini tanlash mumkin.`}
        value={data.gallery}
        max={GALLERY_MAX}
        onChange={(gallery) => updatePhoto({ gallery }, "gallery")}
        onActivate={() => focusPreviewSlot("gallery")}
        placement={<PhotoPlacement slot="gallery" data={data} />}
      />
    </div>
  );
}

export function TemplateStep({ data, update }: StepProps) {
  // Yashirilgan shablondagi mavjud taklifnoma tahrirlanayotgan bo'lsa, uning shabloni ham ko'rinsin
  const current = TEMPLATES[data.template];
  const list = current?.hidden ? [current, ...TEMPLATE_LIST] : TEMPLATE_LIST;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((tpl) => {
        const active = data.template === tpl.key;
        return (
          <div
            key={tpl.key}
            className={`overflow-hidden rounded-3xl border-2 bg-white transition-all ${
              active ? "border-rose shadow-[0_16px_40px_-20px_rgba(155,35,53,0.6)]" : "border-transparent ring-1 ring-ink/10"
            }`}
          >
            <button type="button" onClick={() => update({ template: tpl.key })} className="block w-full text-left">
              <TemplateThumb
                template={tpl.key}
                groom={data.groomName || undefined}
                bride={data.brideName || undefined}
                date={data.date ? data.date.split("-").reverse().join(".") : undefined}
                className="h-60 w-full"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-semibold text-ink">{tpl.name}</span>
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs ${
                      active ? "border-rose bg-rose text-white" : "border-ink/20"
                    }`}
                  >
                    {active && "✓"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/55">{tpl.tagline}</p>
              </div>
            </button>
            {tpl.hidden ? (
              <p className="border-t border-ink/5 px-4 py-2.5 text-xs text-ink/40">Bu shablon yangi taklifnomalar uchun yopilgan</p>
            ) : (
              <Link
                to={`/shablonlar/${tpl.key}`}
                target="_blank"
                className="block border-t border-ink/5 px-4 py-2.5 text-xs font-semibold text-ink/50 hover:text-ink"
              >
                ▶ To'liq namunani ochish
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PublishStepProps extends StepProps {
  exceptId?: string;
  onSlugStatus: (status: SlugStatus) => void;
  slugError?: string;
}

export function PublishStep({ data, update, exceptId, onSlugStatus, slugError }: PublishStepProps) {
  const setFeature = (key: keyof InvitationData["features"], value: boolean) =>
    update({ features: { ...data.features, [key]: value } });

  return (
    <div className="flex flex-col gap-6">
      <SlugField
        value={data.slug}
        onChange={(slug) => update({ slug })}
        exceptId={exceptId}
        onStatus={onSlugStatus}
        serverError={slugError}
      />

      <div className="flex flex-col gap-2.5">
        <p className="text-[13px] font-semibold text-ink/80">Bo'limlar</p>
        <Toggle
          checked={data.features.rsvp}
          onChange={(v) => setFeature("rsvp", v)}
          title="Kelaman / kela olmayman"
          description="Mehmonlar javob beradi, siz kabinetda ro'yxatini ko'rasiz"
        />
        <Toggle
          checked={data.features.wishes}
          onChange={(v) => setFeature("wishes", v)}
          title="Tilaklar devori"
          description="Mehmonlar tabrik qoldiradi, real vaqtda paydo bo'ladi"
        />
        <Toggle
          checked={data.features.gift}
          onChange={(v) => setFeature("gift", v)}
          title="To'yona (karta raqami)"
          description="Uzoqdagi mehmonlar uchun karta raqami va nusxalash tugmasi"
        />
        {data.features.gift && (
          <div className="grid gap-3 rounded-2xl bg-sand/50 p-4 sm:grid-cols-2">
            <Field
              label="Karta raqami"
              inputMode="numeric"
              placeholder="8600 0000 0000 0000"
              value={data.cardNumber}
              onChange={(e) => update({ cardNumber: e.target.value.replace(/[^\d ]/g, "").slice(0, 23) })}
            />
            <Field
              label="Karta egasi"
              placeholder="MIRODIL RAHMONOV"
              value={data.cardHolder}
              onChange={(e) => update({ cardHolder: e.target.value.toUpperCase() })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
