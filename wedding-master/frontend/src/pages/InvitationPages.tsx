import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { loadDraft } from "../lib/draft";
import { DEMO_INVITATION, type InvitationData, type PublicInvitation } from "../types/invitation";
import { InvitationRenderer, FullPageLoader } from "../templates/InvitationRenderer";
import { isTemplateKey, TEMPLATES } from "../templates/registry";
import { useAuth } from "../context/AuthContext";
import { buttonClass } from "../platform/ui";

/** Mehmon ochadigan sahifa: /:slug va /:slug/tilaklar */
export function PublicInvitationPage() {
  const { slug = "" } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    // Qoralama egasiga ko'rinadi — token tekshirilguncha kutamiz
    if (authLoading) return;
    setError(null);
    api<PublicInvitation>(`/public/${slug.toLowerCase()}`)
      .then((inv) => {
        setInvitation(inv);
        document.title = `${inv.groomName} va ${inv.brideName} | To'y taklifnomasi`;
      })
      .catch((err) => setError(err instanceof ApiError ? err.status : 0));
  }, [slug, authLoading, user]);

  if (error !== null) return <NotFoundPage message={error === 404 ? "Bunday taklifnoma topilmadi" : "Serverga ulanib bo'lmadi"} />;
  if (!invitation) return <FullPageLoader />;

  return (
    <>
      {invitation.status === "draft" && (
        <div className="fixed inset-x-0 top-0 z-[10000] bg-ink py-1.5 text-center text-xs font-semibold text-ivory">
          Qoralama — faqat siz ko'ryapsiz. Mehmonlar uchun kabinetdan nashr qiling.
        </div>
      )}
      <InvitationRenderer data={invitation} id={invitation.id} mode="live" basePath={`/${slug}`} />
    </>
  );
}

/** Landingdagi shablon namunasi: /shablonlar/:key */
export function TemplateDemoPage() {
  const { key } = useParams();
  if (!isTemplateKey(key)) return <NotFoundPage message="Bunday shablon yo'q" />;
  const data: InvitationData = { ...DEMO_INVITATION, template: key };
  return (
    <>
      <InvitationRenderer data={data} mode="demo" basePath={`/shablonlar/${key}`} />
      <div className="fixed bottom-5 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink/90 p-1.5 pl-5 text-ivory shadow-2xl backdrop-blur">
        <span className="hidden text-xs sm:inline">
          Namuna: <b>{TEMPLATES[key].name}</b>
        </span>
        <Link to={`/yaratish?shablon=${key}`} className={buttonClass("secondary", "sm", "border-0")}>
          Shu shablon bilan yaratish
        </Link>
      </div>
    </>
  );
}

/** Wizard ichidagi iframe: /korinish?key=... — qoralamani localStorage'dan o'qib, o'zgarishlarni kuzatadi. */
export function PreviewPage() {
  const [params] = useSearchParams();
  const key = params.get("key") ?? "";
  const [data, setData] = useState<InvitationData | null>(() => loadDraft(key)?.data ?? null);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setData(loadDraft(key)?.data ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  if (!data) return <NotFoundPage message="Ko'rinish uchun qoralama topilmadi" />;
  const preview: InvitationData = {
    ...DEMO_INVITATION,
    ...data,
    // Bo'sh maydonlar o'rniga namunani ko'rsatamiz — dizayn yarim bo'sh ko'rinmasin
    groomName: data.groomName || DEMO_INVITATION.groomName,
    brideName: data.brideName || DEMO_INVITATION.brideName,
    date: data.date || DEMO_INVITATION.date,
    venueName: data.venueName || DEMO_INVITATION.venueName,
    slug: data.slug || "namuna",
  };
  return <InvitationRenderer data={preview} mode="preview" basePath="/korinish" />;
}

export function NotFoundPage({ message = "Sahifa topilmadi" }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ivory px-6 text-center">
      <p className="font-display text-7xl font-semibold text-rose/80">404</p>
      <p className="text-lg text-ink/70">{message}</p>
      <Link to="/" className={buttonClass("secondary")}>Bosh sahifaga</Link>
    </div>
  );
}
