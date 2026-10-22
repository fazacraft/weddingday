import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { api, ApiError } from "../../lib/api";
import { PAYMENT_CONTACT, SUPPORT_BOT, inviteLabel, inviteUrl } from "../../lib/site";
import type { OwnedInvitation, Rsvp, Wish } from "../../types/invitation";
import { TEMPLATES } from "../../templates/registry";
import { SiteHeader } from "../../platform/SiteChrome";
import { TemplateThumb } from "../../platform/TemplateThumb";
import { Notice, PButton, PLink, Spinner } from "../../platform/ui";
import { CopyButton, StatusBadge, daysUntil, formatDate, formatDateTime, linkVisible } from "./shared";
import { withBase } from "../../lib/base";

type Tab = "umumiy" | "mehmonlar" | "tilaklar" | "ulashish";

const TABS: { key: Tab; label: string }[] = [
  { key: "umumiy", label: "Umumiy" },
  { key: "mehmonlar", label: "Mehmonlar" },
  { key: "tilaklar", label: "Tilaklar" },
  { key: "ulashish", label: "Ulashish va QR" },
];

export function ManagePage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState<OwnedInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "umumiy") as Tab;
  const isNew = params.get("yangi") === "1";

  const reload = useCallback(() => {
    api<OwnedInvitation>(`/invitations/${id}`)
      .then(setInv)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, [id]);

  useEffect(reload, [reload]);

  // Tasdiq kutilayotganda holatni har 10 soniyada tekshiramiz — admin
  // tasdiqlashi bilan havola sahifani yangilamasdan paydo bo'ladi
  const waiting = inv?.status !== "published" && inv?.review === "pending";
  useEffect(() => {
    if (!waiting) return;
    const t = window.setInterval(reload, 10_000);
    return () => window.clearInterval(t);
  }, [waiting, reload]);

  // Kutish paytida tasdiq kelsa — "nashr qilindi" bannerini havola bilan ko'rsatamiz
  const wasWaiting = useRef(false);
  const [justApproved, setJustApproved] = useState(false);
  useEffect(() => {
    if (waiting) wasWaiting.current = true;
    else if (wasWaiting.current && inv?.status === "published") setJustApproved(true);
  }, [waiting, inv?.status]);

  const setTab = (key: Tab) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    next.delete("yangi");
    setParams(next, { replace: true });
  };

  const toggleStatus = async () => {
    if (!inv) return;
    setBusy(true);
    try {
      setInv(
        await api<OwnedInvitation>(`/invitations/${id}`, {
          method: "PATCH",
          body: { status: inv.status === "published" ? "draft" : "published" },
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!inv) return;
    const ok = window.confirm(
      `"${inv.groomName} & ${inv.brideName}" taklifnomasi, barcha javoblar va tilaklar butunlay o'chiriladi. Davom etasizmi?`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/invitations/${id}`, { method: "DELETE" });
      navigate("/kabinet", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
      setBusy(false);
    }
  };

  if (error && !inv) {
    return (
      <div className="min-h-screen bg-ivory">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <Notice>{error}</Notice>
          <PLink to="/kabinet" variant="secondary" className="mt-6">Kabinetga qaytish</PLink>
        </div>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="min-h-screen bg-ivory">
        <SiteHeader />
        <div className="flex justify-center py-24 text-ink/40"><Spinner className="h-6 w-6" /></div>
      </div>
    );
  }

  const url = inviteUrl(inv.slug);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/kabinet" className="text-sm font-semibold text-ink/50 hover:text-ink">← Barcha taklifnomalar</Link>

        {inv.status !== "published" && (inv.review === "pending" || inv.review === "rejected") && <ReviewBanner inv={inv} />}

        {(isNew || justApproved) && inv.status === "published" && (
          <div className="mt-6 overflow-hidden rounded-[1.75rem] bg-rose px-6 py-7 text-ivory sm:px-8">
            <p className="font-display text-3xl font-semibold">🎉 Taklifnomangiz nashr qilindi!</p>
            <p className="mt-1 text-sm text-ivory/80">Havolani nusxalang va mehmonlarga yuboring.</p>
            <div className="mt-4 flex max-w-xl items-center gap-2 rounded-xl bg-ivory/15 py-1.5 pl-4 pr-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-sm">{inviteLabel(inv.slug)}</span>
              <CopyButton text={url} />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <TemplateThumb
            template={inv.template}
            groom={inv.groomName}
            bride={inv.brideName}
            date={formatDate(inv.date)}
            className="h-28 w-28 shrink-0 rounded-3xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-semibold text-ink">
                {inv.groomName} & {inv.brideName}
              </h1>
              <StatusBadge status={inv.status} review={inv.review} />
            </div>
            <p className="mt-1 text-sm text-ink/55">
              {inv.eventTitle} · {formatDate(inv.date)}, {inv.time} · {inv.venueName} · «{TEMPLATES[inv.template]?.name}» shabloni
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {linkVisible(inv) && (
              <a href={withBase(inv.slug)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-ink/60 hover:text-ink">
                Ochish ↗
              </a>
            )}
            <PLink to={`/kabinet/${inv.id}/tahrirlash`} variant="secondary">Tahrirlash</PLink>
            <PButton
              variant={inv.status === "published" ? "secondary" : "primary"}
              loading={busy}
              disabled={inv.status !== "published" && inv.review === "pending"}
              onClick={() => void toggleStatus()}
            >
              {inv.status === "published"
                ? "Nashrdan olish"
                : inv.review === "pending"
                  ? "To'lov kutilmoqda"
                  : inv.review === "approved"
                    ? "Nashr qilish"
                    : "Faollashtirish"}
            </PButton>
          </div>
        </div>

        {error && <div className="mt-4"><Notice>{error}</Notice></div>}

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-ink/10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.key ? "border-rose text-ink" : "border-transparent text-ink/45 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === "umumiy" && <OverviewTab inv={inv} onRemove={() => void remove()} />}
          {tab === "mehmonlar" && <GuestsTab inv={inv} />}
          {tab === "tilaklar" && <WishesTab inv={inv} onChange={reload} />}
          {tab === "ulashish" && <ShareTab inv={inv} />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 font-display text-5xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

function OverviewTab({ inv, onRemove }: { inv: OwnedInvitation; onRemove: () => void }) {
  const s = inv.stats ?? { wishes: 0, replies: 0, coming: 0, declined: 0 };
  const left = daysUntil(inv.date);
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ochildi" value={inv.openCount} hint="kirish tugmasi bosilgan" />
        <StatCard label="Keladi" value={s.coming} hint={`${s.replies} ta javobdan, mehmonlar soni`} />
        <StatCard label="Kela olmaydi" value={s.declined} />
        <StatCard label="To'ygacha" value={left > 0 ? left : 0} hint={left > 0 ? "kun qoldi" : left === 0 ? "to'y bugun!" : "to'y o'tdi"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-ink/10 bg-white p-6">
          <p className="text-sm font-bold text-ink">Bo'limlar</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink/70">
            <li>{inv.features.rsvp ? "✅" : "▫️"} Kelaman / kela olmayman</li>
            <li>{inv.features.wishes ? "✅" : "▫️"} Tilaklar devori · {s.wishes} ta tilak</li>
            <li>{inv.features.gift ? "✅" : "▫️"} To'yona (karta raqami)</li>
          </ul>
          <PLink to={`/kabinet/${inv.id}/tahrirlash`} variant="secondary" size="sm" className="mt-5">
            O'zgartirish
          </PLink>
        </div>
        <div className="rounded-3xl border border-rose/20 bg-white p-6">
          <p className="text-sm font-bold text-ink">Taklifnomani o'chirish</p>
          <p className="mt-2 text-sm text-ink/55">
            Havola ishlamay qoladi, barcha javoblar va tilaklar ham o'chadi. Buni qaytarib bo'lmaydi.
          </p>
          <PButton variant="danger" size="sm" className="mt-5" onClick={onRemove}>
            O'chirish
          </PButton>
        </div>
      </div>
    </div>
  );
}

function useOwnerList<T>(path: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    api<T[]>(path)
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, [path]);
  useEffect(load, [load]);
  return { items, error, setItems };
}

function GuestsTab({ inv }: { inv: OwnedInvitation }) {
  const { items, error } = useOwnerList<Rsvp>(`/invitations/${inv.id}/rsvps`);
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");

  if (error) return <Notice>{error}</Notice>;
  if (!items) return <div className="flex justify-center text-ink/40"><Spinner className="h-6 w-6" /></div>;
  if (!inv.features.rsvp && items.length === 0) {
    return <Notice tone="info">Bu taklifnomada "Kelaman / kela olmayman" bo'limi o'chirilgan. Tahrirlash orqali yoqing.</Notice>;
  }

  const shown = items.filter((r) => filter === "all" || (filter === "yes" ? r.attending : !r.attending));
  const coming = items.filter((r) => r.attending).reduce((n, r) => n + r.guests, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {([
            ["all", `Hammasi · ${items.length}`],
            ["yes", `Keladi · ${items.filter((r) => r.attending).length}`],
            ["no", `Kela olmaydi · ${items.filter((r) => !r.attending).length}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-9 rounded-full px-4 text-[13px] font-semibold ${filter === key ? "bg-ink text-ivory" : "bg-white text-ink/60 ring-1 ring-ink/10"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink/55">Jami kelayotganlar: <b className="text-ink">{coming} kishi</b></p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink/45">Hali javoblar yo'q. Havolani ulashing!</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-3xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/40 text-[11px] uppercase tracking-wider text-ink/45">
              <tr>
                <th className="px-5 py-3 font-bold">Ism</th>
                <th className="px-5 py-3 font-bold">Javob</th>
                <th className="hidden px-5 py-3 font-bold sm:table-cell">Kishi</th>
                <th className="hidden px-5 py-3 font-bold sm:table-cell">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {shown.map((r) => (
                <tr key={r._id}>
                  <td className="px-5 py-3.5 font-semibold text-ink">{r.name}</td>
                  <td className="px-5 py-3.5">
                    {r.attending ? (
                      <span className="text-emerald-700">✓ Keladi{r.guests > 1 ? ` (${r.guests})` : ""}</span>
                    ) : (
                      <span className="text-ink/45">Kela olmaydi</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink/70 sm:table-cell">{r.attending ? r.guests : "—"}</td>
                  <td className="hidden px-5 py-3.5 text-ink/45 sm:table-cell">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WishesTab({ inv, onChange }: { inv: OwnedInvitation; onChange: () => void }) {
  const { items, error, setItems } = useOwnerList<Wish>(`/invitations/${inv.id}/wishes`);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const remove = async (wish: Wish) => {
    if (!window.confirm(`${wish.name}ning tilagi o'chirilsinmi?`)) return;
    setRemoveError(null);
    try {
      await api(`/invitations/${inv.id}/wishes/${wish._id}`, { method: "DELETE" });
      setItems((prev) => prev?.filter((w) => w._id !== wish._id) ?? null);
      onChange();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
    }
  };

  if (error) return <Notice>{error}</Notice>;
  if (!items) return <div className="flex justify-center text-ink/40"><Spinner className="h-6 w-6" /></div>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-ink/45">Hali tilaklar yo'q.</p>;

  return (
    <div className="flex flex-col gap-4">
      {removeError && <Notice>{removeError}</Notice>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((w) => (
          <article key={w._id} className="rounded-3xl border border-ink/10 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{w.name}</p>
                <p className="text-xs text-ink/40">{formatDateTime(w.createdAt)}</p>
              </div>
              <button onClick={() => void remove(w)} className="text-xs font-semibold text-ink/40 hover:text-rose">
                O'chirish
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/70">{w.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

const REMIND_AFTER_MS = 5 * 60_000;

/** To'lov kutilmoqda (bot orqali to'lov va chek) yoki rad etildi. */
function ReviewBanner({ inv }: { inv: OwnedInvitation }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(t);
  }, []);

  const since = inv.reviewRequestedAt ? new Date(inv.reviewRequestedAt).getTime() : now;
  const waitedMin = Math.max(0, Math.floor((now - since) / 60_000));
  const late = now - since >= REMIND_AFTER_MS;
  const botUrl = inv.supportBot ? `https://t.me/${inv.supportBot}?start=${inv.id}` : null;

  if (inv.review === "rejected") {
    return (
      <div className="mt-6 rounded-[1.75rem] bg-rose/5 px-6 py-7 text-ink ring-1 ring-rose/20 sm:px-8">
        <p className="font-display text-3xl font-semibold text-rose">Taklifnoma rad etildi</p>
        <p className="mt-1 text-sm text-ink/65">
          Ma'lumotlarni tekshirib, "Faollashtirish" tugmasi bilan qayta yuboring. Savol bo'lsa, botga yozing.
        </p>
        {botUrl && (
          <a href={botUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-[#229ED9] px-5 text-sm font-semibold text-white hover:opacity-90">
            Telegram botga yozish
          </a>
        )}
      </div>
    );
  }

  const fallbackBot = `https://t.me/${SUPPORT_BOT}?start=${inv.id}`;
  return (
    <div className="mt-6 rounded-[1.75rem] bg-amber-50 px-6 py-7 text-amber-900 ring-1 ring-amber-200 sm:px-8">
      <p className="font-display text-3xl font-semibold">💳 Faollashtirish uchun to'lov qiling</p>
      <p className="mt-1 text-sm text-amber-900/75">
        Taklifnomangiz tayyor. Havola to'lov tasdiqlangach ishlaydi va shu yerda o'zi paydo bo'ladi — sahifani yangilash
        shart emas.
      </p>
      <ol className="mt-4 flex flex-col gap-1.5 text-sm text-amber-900/85">
        <li><b>1.</b> Pastdagi tugma bilan Telegram botimizni oching — u yerda karta raqami chiqadi.</li>
        <li><b>2.</b> To'lovni amalga oshiring.</li>
        <li>
          <b>3.</b> To'lov chekini (skrinshot) botga yoki <b>@{PAYMENT_CONTACT}</b> ga yuboring —{" "}
          <b>chek yuborish majburiy</b>.
        </li>
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={botUrl ?? fallbackBot}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#229ED9] px-5 text-sm font-semibold text-white hover:opacity-90"
        >
          Telegram botni ochish
        </a>
        <a
          href={`https://t.me/${PAYMENT_CONTACT}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-amber-900/70 ring-1 ring-amber-300 hover:text-amber-900"
        >
          @{PAYMENT_CONTACT}
        </a>
        {waitedMin > 0 && <span className="text-xs text-amber-900/60">Kutilmoqda: {waitedMin} daqiqa</span>}
      </div>
      {late && (
        <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-amber-900/80 ring-1 ring-amber-200">
          Chekni yuborganingizga 5 daqiqadan oshgan bo'lsa, botga yana yozing yoki <b>@{PAYMENT_CONTACT}</b> ga murojaat
          qiling.
        </p>
      )}
    </div>
  );
}

function ShareTab({ inv }: { inv: OwnedInvitation }) {
  const [guest, setGuest] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const url = inviteUrl(inv.slug);
  const personal = guest.trim() ? `${url}?name=${encodeURIComponent(guest.trim())}` : url;
  const text = `${inv.groomName} va ${inv.brideName}ning ${inv.eventTitle.toLowerCase()}ga taklif etamiz!`;

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${inv.slug}-qr.png`;
    a.click();
  };

  if (!linkVisible(inv)) {
    return (
      <Notice tone="info">
        {inv.review === "pending"
          ? "Havola, ulashish tugmalari va QR kod to'lov tasdiqlangach shu yerda paydo bo'ladi."
          : inv.review === "rejected"
            ? "Taklifnoma rad etilgan. Ma'lumotlarni to'g'irlab, qayta tasdiqlashga yuboring."
            : "Havola olish uchun avval taklifnomani tasdiqlashga yuboring."}
      </Notice>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-6">
        {inv.status === "draft" && (
          <Notice tone="info">
            {inv.review === "pending"
              ? "Taklifnoma to'lov tasdig'ini kutyapti — tasdiqlangach mehmonlar havolani ocha oladi."
              : inv.review === "rejected"
                ? "Taklifnoma admin tomonidan rad etilgan. Ma'lumotlarni to'g'irlab, qayta tasdiqlashga yuboring."
                : "Taklifnoma hozir qoralama — mehmonlar havolani ochsa \"topilmadi\" ko'radi. Avval nashr qiling."}
          </Notice>
        )}

        <section className="rounded-3xl border border-ink/10 bg-white p-6">
          <p className="text-sm font-bold text-ink">Havola</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-sand/50 py-1.5 pl-4 pr-1.5">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink/80">{inviteLabel(inv.slug)}</span>
            <CopyButton text={url} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className="inline-flex h-10 items-center rounded-full bg-[#229ED9] px-4 text-sm font-semibold text-white hover:opacity-90"
              href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
            <a
              className="inline-flex h-10 items-center rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white hover:opacity-90"
              href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-ink/10 bg-white p-6">
          <p className="text-sm font-bold text-ink">Mehmon ismi bilan havola</p>
          <p className="mt-1 text-sm text-ink/55">
            Taklifnoma ochilganda "Assalomu alaykum, hurmatli Akmal aka" deb murojaat qiladi va javob formasida ism tayyor turadi.
          </p>
          <input
            value={guest}
            onChange={(e) => setGuest(e.target.value)}
            placeholder="Masalan: Akmal aka"
            className="mt-4 h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-[15px] focus:border-rose/60 focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-sand/50 py-1.5 pl-4 pr-1.5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink/70">{personal}</span>
            <CopyButton text={personal} />
          </div>
        </section>
      </div>

      <section className="flex flex-col items-center rounded-3xl border border-ink/10 bg-white p-6 text-center">
        <p className="text-sm font-bold text-ink">QR kod</p>
        <p className="mt-1 text-sm text-ink/55">Bosma taklifnomaga yoki stol kartochkasiga qo'ying.</p>
        <div ref={qrRef} className="mt-5 rounded-2xl border border-ink/10 p-4">
          <QRCodeCanvas value={personal} size={220} level="M" fgColor="#1f1a17" bgColor="#ffffff" marginSize={1} />
        </div>
        <PButton variant="secondary" size="sm" className="mt-5" onClick={downloadQr}>
          PNG yuklab olish
        </PButton>
      </section>
    </div>
  );
}
