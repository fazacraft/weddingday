import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../lib/api";
import {
  CREATE_DRAFT_KEY,
  editDraftKey,
  loadDraft,
  saveDraft,
  clearDraft,
  toInvitationData,
} from "../../lib/draft";
import { slugify } from "../../lib/site";
import { EMPTY_INVITATION, type InvitationData, type OwnedInvitation } from "../../types/invitation";
import { isTemplateKey } from "../../templates/registry";
import { FullPageLoader } from "../../templates/InvitationRenderer";
import { Logo } from "../../platform/SiteChrome";
import { LivePreview } from "../../platform/PhoneFrame";
import { Eyebrow, Notice, PButton, PLink } from "../../platform/ui";
import {
  DateStep,
  DetailsStep,
  MediaStep,
  NamesStep,
  PublishStep,
  TemplateStep,
  VenueStep,
  type StepProps,
} from "./steps";
import type { SlugStatus } from "./SlugField";

interface StepDef {
  title: string;
  heading: string;
  hint: string;
  Component?: ComponentType<StepProps>;
  missing: (d: InvitationData) => string[];
}

const STEPS: StepDef[] = [
  {
    title: "Ismlar",
    heading: "Taklifnomada kimlarning ismi bo'ladi?",
    hint: "Mehmonlar ko'rishini istagan ko'rinishda yozing. Keyin istalgan payt o'zgartirasiz.",
    Component: NamesStep,
    missing: (d) => [!d.groomName.trim() && "kuyov ismi", !d.brideName.trim() && "kelin ismi"].filter(Boolean) as string[],
  },
  {
    title: "Sana",
    heading: "Katta kun qachon?",
    hint: "Sana va marosim boshlanadigan vaqtni tanlang.",
    Component: DateStep,
    missing: (d) => [!d.date && "sana", !d.time && "vaqt"].filter(Boolean) as string[],
  },
  {
    title: "Manzil",
    heading: "To'y qayerda bo'ladi?",
    hint: "To'yxona nomi va manzili. Xarita havolasi bo'lsa, mehmonlar bir bosishda yo'l topadi.",
    Component: VenueStep,
    missing: (d) => [!d.venueName.trim() && "to'yxona nomi"].filter(Boolean) as string[],
  },
  {
    title: "Matn",
    heading: "Mehmonlarga nima deysiz?",
    hint: "Tayyor matnni qoldirishingiz yoki o'zingizcha yozishingiz mumkin. Dastur ixtiyoriy.",
    Component: DetailsStep,
    missing: (d) =>
      d.schedule.some((s) => !s.title.trim() || !s.time) ? ["dasturdagi bo'sh band (o'chiring yoki to'ldiring)"] : [],
  },
  {
    title: "Rasm va musiqa",
    heading: "Surat va musiqa qo'shasizmi?",
    hint: "Ikkalasi ham ixtiyoriy — bu qadamni o'tkazib yuborsangiz ham bo'ladi.",
    Component: MediaStep,
    missing: () => [],
  },
  {
    title: "Shablon",
    heading: "Dizaynni tanlang",
    hint: "O'ngdagi ko'rinish darhol almashadi. Keyin kabinetdan ham o'zgartirsa bo'ladi.",
    Component: TemplateStep,
    missing: () => [],
  },
  {
    title: "Havola",
    heading: "Taklifnoma havolasi",
    hint: "Oxirgi qadam: qisqa manzil tanlang va qaysi bo'limlar chiqishini belgilang.",
    missing: (d) =>
      [
        !d.slug && "havola",
        d.features.gift && !d.cardNumber.replace(/\s/g, "") && "karta raqami",
      ].filter(Boolean) as string[],
  },
];

const LAST = STEPS.length - 1;

interface Props {
  mode: "create" | "edit";
}

export function BuilderPage({ mode }: Props) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const storageKey = mode === "edit" && id ? editDraftKey(id) : CREATE_DRAFT_KEY;

  const [data, setData] = useState<InvitationData | null>(() => {
    if (mode === "edit") return null;
    const saved = loadDraft(CREATE_DRAFT_KEY);
    const base = saved?.data ?? { ...EMPTY_INVITATION };
    const tpl = params.get("shablon");
    return isTemplateKey(tpl) ? { ...base, template: tpl } : base;
  });
  const [step, setStep] = useState(() => (mode === "create" ? loadDraft(CREATE_DRAFT_KEY)?.step ?? 0 : 0));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  // Tahrirlash: taklifnomani serverdan yuklaymiz
  useEffect(() => {
    if (mode !== "edit" || !id) return;
    api<OwnedInvitation>(`/invitations/${id}`)
      .then((inv) => {
        setData(toInvitationData(inv));
        setOriginalSlug(inv.slug);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, [mode, id]);

  // Har o'zgarishda qoralamani saqlaymiz — jonli ko'rinish (iframe) shundan o'qiydi
  useEffect(() => {
    if (data) saveDraft(storageKey, data, step);
  }, [data, step, storageKey]);

  // Tahrirlash qoralamasi faqat jonli ko'rinish uchun — sahifadan chiqqach tozalanadi
  useEffect(() => {
    if (mode !== "edit") return;
    return () => clearDraft(storageKey);
  }, [mode, storageKey]);

  const update = useCallback((patch: Partial<InvitationData>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
    if (patch.slug !== undefined) setSlugError(undefined);
  }, []);

  // Oxirgi qadamga kelganda havola bo'sh bo'lsa, ismlardan taklif qilamiz
  useEffect(() => {
    if (step === LAST && data && !data.slug) {
      update({ slug: slugify(data.groomName, data.brideName) });
    }
  }, [step, data, update]);

  const missingByStep = useMemo(() => (data ? STEPS.map((s) => s.missing(data)) : []), [data]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-6 text-center">
        <p className="text-ink/60">{loadError}</p>
        <PLink to="/kabinet" variant="secondary">Kabinetga qaytish</PLink>
      </div>
    );
  }
  if (!data) return <FullPageLoader />;

  const current = STEPS[step];
  const missing = missingByStep[step];
  // Tahrirlashda o'zgarmagan manzil qayta tekshirilmaydi (SlugField faqat oxirgi qadamda turadi)
  const slugOk = slugStatus === "available" || (originalSlug !== null && data.slug === originalSlug);

  const goTo = (i: number) => {
    setShowMissing(false);
    setStep(Math.max(0, Math.min(LAST, i)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (missing.length) {
      setShowMissing(true);
      return;
    }
    goTo(step + 1);
  };

  /** Hamma qadamlar to'liqmi — yo'q bo'lsa birinchi kamchilikli qadamga o'tkazadi. */
  const ensureComplete = (): boolean => {
    const firstBad = missingByStep.findIndex((m) => m.length > 0);
    if (firstBad !== -1) {
      goTo(firstBad);
      setShowMissing(true);
      return false;
    }
    if (!slugOk) {
      goTo(LAST);
      setSlugError(slugStatus === "taken" ? "Bu manzil band. Boshqasini tanlang." : "Havolani tekshirib bo'lmadi");
      return false;
    }
    return true;
  };

  const handleError = (err: unknown) => {
    if (err instanceof ApiError && err.field === "slug") {
      setSlugError(err.message);
      goTo(LAST);
    } else {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    }
  };

  const publish = async () => {
    setError(null);
    if (!ensureComplete()) return;
    if (!user) {
      saveDraft(storageKey, data, LAST);
      navigate(`/royxatdan-otish?next=${encodeURIComponent("/yaratish")}`);
      return;
    }
    setBusy(true);
    try {
      const inv = await api<OwnedInvitation>("/invitations", {
        method: "POST",
        body: { ...data, status: "published" },
      });
      clearDraft(CREATE_DRAFT_KEY);
      navigate(`/kabinet/${inv.id}?yangi=1`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setError(null);
    if (!ensureComplete() || !id) return;
    setBusy(true);
    try {
      const inv = await api<OwnedInvitation>(`/invitations/${id}`, { method: "PATCH", body: data });
      setData(toInvitationData(inv));
      setOriginalSlug(inv.slug);
      setSaved(true);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const StepComponent = current.Component;

  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {mode === "edit" && (
              <PButton size="sm" onClick={() => void saveEdit()} loading={busy}>
                {saved ? "Saqlandi ✓" : "Saqlash"}
              </PButton>
            )}
            <Link
              to={mode === "edit" ? `/kabinet/${id}` : user ? "/kabinet" : "/"}
              className="grid h-10 w-10 place-items-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink"
              aria-label="Yopish"
            >
              ✕
            </Link>
          </div>
        </div>
        <div className="h-0.5 bg-ink/5">
          <div className="h-full bg-rose transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0">
          <nav className="-mx-4 mb-8 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Qadamlar">
            {STEPS.map((s, i) => {
              const done = i < step && missingByStep[i].length === 0;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                    i === step ? "bg-ink text-ivory" : done ? "bg-white text-ink ring-1 ring-ink/10" : "text-ink/45 hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                      i === step ? "bg-ivory/20" : done ? "bg-rose text-white" : "bg-ink/10"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {s.title}
                </button>
              );
            })}
          </nav>

          <Eyebrow>
            Qadam {step + 1} / {STEPS.length}
          </Eyebrow>
          <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">{current.heading}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink/55">{current.hint}</p>

          <div className="mt-8">
            {StepComponent ? (
              <StepComponent data={data} update={update} />
            ) : (
              <PublishStep
                data={data}
                update={update}
                exceptId={mode === "edit" ? id : undefined}
                onSlugStatus={setSlugStatus}
                slugError={slugError}
              />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {showMissing && missing.length > 0 && <Notice>To'ldiring: {missing.join(", ")}</Notice>}
            {error && <Notice>{error}</Notice>}
            {mode === "create" && step === LAST && !user && (
              <Notice tone="info">
                Nashr qilish uchun email bilan kirish kerak bo'ladi. Qoralamangiz saqlanib qoladi.
              </Notice>
            )}
            {mode === "edit" && saved && <Notice tone="success">O'zgarishlar saqlandi — mehmonlar darhol yangisini ko'radi.</Notice>}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink/10 pt-6">
            <PButton variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
              ← Orqaga
            </PButton>
            <div className="flex items-center gap-2">
              <a
                href={`/korinish?key=${encodeURIComponent(storageKey)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-ink/60 hover:text-ink lg:hidden"
              >
                Ko'rish ↗
              </a>
              {step < LAST ? (
                <PButton onClick={next}>Keyingi →</PButton>
              ) : mode === "create" ? (
                <PButton onClick={() => void publish()} loading={busy} disabled={slugStatus === "checking"}>
                  {user ? "Nashr qilish · Havolani olish" : "Kirish va nashr qilish"}
                </PButton>
              ) : (
                <PButton onClick={() => void saveEdit()} loading={busy}>
                  {saved ? "Saqlandi ✓" : "O'zgarishlarni saqlash"}
                </PButton>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col items-center gap-3">
            <LivePreview storageKey={storageKey} className="h-[700px] w-[350px]" />
            <p className="text-center text-xs text-ink/40">Jonli ko'rinish · kirish tugmasini bosib ko'ring</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
