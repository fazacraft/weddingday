import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, setToken } from "../../lib/api";
import { adminApi } from "../../lib/adminAuth";
import { withBase } from "../../lib/base";
import { TEMPLATES } from "../../templates/registry";
import type { TemplateKey } from "../../types/invitation";
import { SiteHeader } from "../../platform/SiteChrome";
import { Eyebrow, Notice, PButton, Spinner } from "../../platform/ui";
import { inviteUrl } from "../../lib/site";
import { CopyButton, formatDate, formatDateTime } from "../dashboard/shared";
import { MusicTab } from "./MusicTab";
import { TemplatesTab } from "./TemplatesTab";

interface AdminStats {
  users: number;
  invitations: number;
  published: number;
  pending: number;
  wishes: number;
  rsvps: number;
}

interface AdminInvitation {
  id: string;
  slug: string;
  template: TemplateKey;
  status: "draft" | "published";
  review?: string;
  groomName: string;
  brideName: string;
  date: string;
  venueName: string;
  openCount: number;
  featured?: boolean;
  hideFromShowcase?: boolean;
  showcaseHidden?: boolean;
  createdAt: string;
  /** Imzolangan kalit: /slug?k=... — tasdiqlanmagan taklifnoma ham ochiladi */
  previewKey: string;
  owner: { id: string; name: string; email: string } | null;
  wishes: number;
  replies: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  invitations: number;
}

interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

type Tab = "taklifnomalar" | "foydalanuvchilar" | "musiqalar" | "shablonlar";
const TABS: Tab[] = ["taklifnomalar", "foydalanuvchilar", "musiqalar", "shablonlar"];

export function AdminPage({ onLogout }: { onLogout?: () => void } = {}) {
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.find((key) => key === params.get("tab")) ?? "taklifnomalar";
  const [stats, setStats] = useState<AdminStats | null>(null);

  const loadStats = useCallback(() => {
    adminApi<AdminStats>("/admin/stats").then(setStats).catch(() => setStats(null));
  }, []);
  useEffect(loadStats, [loadStats]);

  const setTab = (key: Tab) => {
    const next = new URLSearchParams();
    next.set("tab", key);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>Admin</Eyebrow>
            <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">Boshqaruv paneli</h1>
          </div>
          {onLogout && (
            <PButton variant="secondary" size="sm" onClick={onLogout}>
              Admin paneldan chiqish
            </PButton>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Foydalanuvchi", stats?.users],
            ["Taklifnoma", stats?.invitations],
            ["Nashrda", stats?.published],
            ["Tasdiq kutmoqda", stats?.pending],
            ["Tilak", stats?.wishes],
            ["Javob (RSVP)", stats?.rsvps],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">{label}</p>
              <p className="mt-1 font-display text-3xl font-semibold text-ink">{value ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-ink/10">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === key ? "border-rose text-ink" : "border-transparent text-ink/45 hover:text-ink"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === "taklifnomalar" ? (
            <InvitationsTab ownerFilter={params.get("owner")} onChange={loadStats} />
          ) : tab === "musiqalar" ? (
            <MusicTab />
          ) : tab === "shablonlar" ? (
            <TemplatesTab />
          ) : (
            <UsersTab onChange={loadStats} />
          )}
        </div>
      </main>
    </div>
  );
}

function useAdminList<T>(path: string, query: Record<string, string>) {
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v)).toString();

  const load = useCallback(() => {
    setError(null);
    adminApi<Paged<T>>(`${path}${qs ? `?${qs}` : ""}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, [path, qs]);

  useEffect(load, [load]);
  return { data, error, reload: load };
}

function SearchBar({ value, onSearch, placeholder }: { value: string; onSearch: (q: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(text.trim());
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 text-sm focus:border-rose/60 focus:outline-none"
      />
      <PButton type="submit" variant="secondary">Qidirish</PButton>
    </form>
  );
}

function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between text-sm text-ink/55">
      <span>
        {total} tadan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
      </span>
      <div className="flex gap-2">
        <PButton size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Oldingi</PButton>
        <PButton size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Keyingi →</PButton>
      </div>
    </div>
  );
}

function InvitationsTab({ ownerFilter, onChange }: { ownerFilter: string | null; onChange: () => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<AdminInvitation>("/admin/invitations", {
    q,
    status,
    page: String(page),
    owner: ownerFilter ?? "",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (inv: AdminInvitation, kind: "delete" | InvitationState | ShowcaseState) => {
    const names = `"${inv.groomName} & ${inv.brideName}" (/${inv.slug})`;
    const question =
      kind === "delete"
        ? `${names} butunlay o'chirilsinmi?\nTilaklar, javoblar va yuklangan rasm/musiqa ham o'chadi. Qaytarib bo'lmaydi.`
        : kind === "rejected"
          ? `${names} rad etilsinmi?\nHavola yopiladi; egasi botga ulangan bo'lsa, unga xabar boradi.`
          : kind === "draft" && inv.status === "published"
            ? `${names} nashrdan olinsinmi?\nMehmonlar havolani ocha olmay qoladi.`
            : null;
    if (question && !window.confirm(question)) return;
    setBusyId(inv.id);
    setActionError(null);
    try {
      if (kind === "delete") {
        await adminApi(`/admin/invitations/${inv.id}`, { method: "DELETE" });
      } else if (kind === "pinned") {
        // Yashirilgan bo'lsa ham — mahkamlash uni qaytaradi
        await adminApi(`/admin/invitations/${inv.id}/featured`, { method: "PATCH", body: { featured: true } });
      } else if (kind === "hidden") {
        // Yashirish mahkamni ham bo'shatadi
        await adminApi(`/admin/invitations/${inv.id}/showcase`, { method: "PATCH", body: { hidden: true } });
      } else if (kind === "visible") {
        if (inv.showcaseHidden) await adminApi(`/admin/invitations/${inv.id}/showcase`, { method: "PATCH", body: { hidden: false } });
        if (inv.featured) await adminApi(`/admin/invitations/${inv.id}/featured`, { method: "PATCH", body: { featured: false } });
      } else if (kind === "rejected" || (kind === "published" && inv.review !== "approved")) {
        // Tasdiqlash/rad etish — egasi botga ulangan bo'lsa, unga Telegram xabari ham boradi
        const decision = kind === "rejected" ? "reject" : "approve";
        await adminApi(`/admin/invitations/${inv.id}/review`, { method: "POST", body: { decision } });
      } else if (kind === "published" || kind === "draft") {
        await adminApi(`/admin/invitations/${inv.id}`, { method: "PATCH", body: { status: kind } });
      }
      reload();
      onChange();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBar
            value={q}
            onSearch={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Ism, havola, to'yxona yoki egasining email'i"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-ink/15 bg-white px-3 text-sm"
        >
          <option value="">Hammasi</option>
          <option value="pending">Tasdiq kutmoqda</option>
          <option value="published">Nashrda</option>
          <option value="draft">Qoralama</option>
          <option value="showcase">Namunalarda ko'rinadi</option>
          <option value="featured">Namunalarda mahkamlangan</option>
          <option value="showcase-hidden">Namunalardan yashirilgan</option>
        </select>
      </div>

      {ownerFilter && (
        <Notice tone="info">
          Bitta foydalanuvchining taklifnomalari ko'rsatilmoqda.{" "}
          <Link to="/admin" className="font-semibold underline">Hammasini ko'rsatish</Link>
        </Notice>
      )}
      {error && <Notice>{error}</Notice>}
      {actionError && <Notice>{actionError}</Notice>}

      {!data ? (
        <div className="flex justify-center py-10 text-ink/40"><Spinner className="h-6 w-6" /></div>
      ) : data.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/45">Hech narsa topilmadi.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-ink/10 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-sand/40 text-[11px] uppercase tracking-wider text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">Taklifnoma</th>
                <th className="px-4 py-3 font-bold">Egasi</th>
                <th className="px-4 py-3 font-bold">Holat</th>
                <th className="px-4 py-3 font-bold">Faollik</th>
                <th className="px-4 py-3 font-bold">Yaratilgan</th>
                <th className="px-4 py-3 text-right font-bold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.items.map((inv) => (
                <tr key={inv.id} className={busyId === inv.id ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">
                      {inv.groomName} & {inv.brideName}
                    </p>
                    <p className="text-xs text-ink/45">
                      /{inv.slug} · {TEMPLATES[inv.template]?.name ?? inv.template} · {formatDate(inv.date)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {inv.owner ? (
                      <>
                        <p className="text-ink/80">{inv.owner.name}</p>
                        <p className="text-xs text-ink/45">{inv.owner.email}</p>
                      </>
                    ) : (
                      <span className="text-xs text-ink/40">o'chirilgan</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <InvitationStateSelect inv={inv} disabled={busyId === inv.id} onSelect={(state) => void act(inv, state)} />
                    <ShowcaseSelect inv={inv} disabled={busyId === inv.id} onSelect={(state) => void act(inv, state)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/55">
                    {inv.openCount} ochildi · {inv.replies} javob · {inv.wishes} tilak
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/45">{formatDateTime(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href={inv.status === "published" ? withBase(inv.slug) : `${withBase(inv.slug)}?k=${inv.previewKey}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink"
                      >
                        Ochish ↗
                      </a>
                      {inv.status !== "published" && (
                        <CopyButton text={`${inviteUrl(inv.slug)}?k=${inv.previewKey}`} label="Havola" />
                      )}
                      <button
                        disabled={busyId === inv.id}
                        onClick={() => void act(inv, "delete")}
                        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-rose ring-1 ring-rose/25 hover:bg-rose hover:text-white"
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} total={data.total} pageSize={data.pageSize} onPage={setPage} />}
    </div>
  );
}

function UsersTab({ onChange }: { onChange: () => void }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<AdminUser>("/admin/users", { q, page: String(page) });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Parollar faqat xesh holida saqlanadi — admin parolsiz, 2 soatlik token bilan kiradi
  const impersonate = async (user: AdminUser) => {
    const ok = window.confirm(
      `${user.name} (${user.email}) hisobiga kirasizmi?\nUning kabineti ochiladi (2 soat). Saytdagi o'z hisobingizdan chiqasiz — admin panel ochiq qoladi.`
    );
    if (!ok) return;
    setBusyId(user.id);
    setActionError(null);
    try {
      const { token } = await adminApi<{ token: string }>(`/admin/users/${user.id}/impersonate`, { method: "POST" });
      setToken(token);
      // To'liq qayta yuklash — AuthContext yangi tokenni o'qiydi
      window.location.assign(withBase("/kabinet"));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
      setBusyId(null);
    }
  };

  const remove = async (user: AdminUser) => {
    const ok = window.confirm(
      `${user.email} hisobi va uning ${user.invitations} ta taklifnomasi butunlay o'chirilsinmi? Qaytarib bo'lmaydi.`
    );
    if (!ok) return;
    setBusyId(user.id);
    setActionError(null);
    try {
      await adminApi(`/admin/users/${user.id}`, { method: "DELETE" });
      reload();
      onChange();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={q}
        onSearch={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Ism yoki email"
      />
      {error && <Notice>{error}</Notice>}
      {actionError && <Notice>{actionError}</Notice>}

      {!data ? (
        <div className="flex justify-center py-10 text-ink/40"><Spinner className="h-6 w-6" /></div>
      ) : data.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/45">Hech kim topilmadi.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sand/40 text-[11px] uppercase tracking-wider text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">Foydalanuvchi</th>
                <th className="px-4 py-3 font-bold">Taklifnomalar</th>
                <th className="px-4 py-3 font-bold">Ro'yxatdan o'tgan</th>
                <th className="px-4 py-3 text-right font-bold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.items.map((u) => (
                <tr key={u.id} className={busyId === u.id ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">
                      {u.name}
                      {u.isAdmin && (
                        <span className="ml-2 rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose">admin</span>
                      )}
                    </p>
                    <p className="text-xs text-ink/45">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.invitations > 0 ? (
                      <Link to={`/admin?tab=taklifnomalar&owner=${u.id}`} className="font-semibold text-ink underline-offset-2 hover:underline">
                        {u.invitations} ta
                      </Link>
                    ) : (
                      <span className="text-ink/40">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/45">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => void impersonate(u)}
                        title="Parolsiz, uning hisobiga kirib kabinetini ko'rish"
                        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-ink/60 ring-1 ring-ink/10 hover:text-ink"
                      >
                        Kirish →
                      </button>
                      {!u.isAdmin && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => void remove(u)}
                          className="h-8 rounded-lg px-2.5 text-xs font-semibold text-rose ring-1 ring-rose/25 hover:bg-rose hover:text-white"
                        >
                          O'chirish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} total={data.total} pageSize={data.pageSize} onPage={setPage} />}
    </div>
  );
}

/** Taklifnoma saytdagi "Namunalar"da ko'rinadimi — admin jadvali uchun qisqa belgi. */
type InvitationState = "pending" | "published" | "draft" | "rejected";
type ShowcaseState = "visible" | "pinned" | "hidden";

const SELECT_TONES = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-300 bg-amber-50 text-amber-800",
  rose: "border-rose/25 bg-rose/5 text-rose",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  gray: "border-ink/15 bg-ink/5 text-ink/60",
} as const;

/** Jadvaldagi holat tanlagichi: sarlavha + rangli ochiladigan ro'yxat. */
function StateSelect<T extends string>({
  label,
  value,
  options,
  tone,
  disabled,
  onSelect,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  tone: keyof typeof SELECT_TONES;
  disabled: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <label className="mt-1.5 flex flex-col gap-0.5 first:mt-0">
      <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-ink/40">{label}</span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value as T)}
        className={`h-8 w-fit rounded-lg border px-2 text-xs font-semibold ${SELECT_TONES[tone]}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.value === value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Taklifnoma holati. To'lov kutayotganini "Nashrda"ga o'tkazish — tasdiqlash,
 * "Rad etilgan" — rad etish (egasiga Telegram xabari bilan). "To'lov kutilmoqda"ni
 * faqat egasi so'raydi, shuning uchun u faqat joriy holat sifatida chiqadi.
 */
function InvitationStateSelect({ inv, disabled, onSelect }: { inv: AdminInvitation; disabled: boolean; onSelect: (state: InvitationState) => void }) {
  const value: InvitationState =
    inv.status === "published" ? "published" : inv.review === "pending" ? "pending" : inv.review === "rejected" ? "rejected" : "draft";
  const waiting = value === "pending" || value === "rejected";
  const options: { value: InvitationState; label: string }[] = [
    ...(value === "pending" ? [{ value: "pending" as const, label: "⏳ To'lov kutilmoqda" }] : []),
    { value: "published", label: waiting ? "✅ Tasdiqlash — nashrga" : "✅ Nashrda" },
    ...(waiting ? [] : [{ value: "draft" as const, label: value === "published" ? "Qoralama — nashrdan olish" : "Qoralama" }]),
    ...(value === "draft" ? [] : [{ value: "rejected" as const, label: value === "pending" ? "❌ Rad etish" : "❌ Rad etilgan" }]),
  ];
  const tone = value === "published" ? "green" : value === "pending" ? "amber" : value === "rejected" ? "rose" : "gray";
  return <StateSelect label="Taklifnoma" value={value} options={options} tone={tone} disabled={disabled} onSelect={onSelect} />;
}

const SHOWCASE_OPTIONS: { value: ShowcaseState; label: string }[] = [
  { value: "visible", label: "Ko'rinadi" },
  { value: "pinned", label: "📌 Eng boshida" },
  { value: "hidden", label: "Yashirilgan" },
];

/** Saytdagi «Namunalar» ro'yxatidagi holati — faqat nashrdagi taklifnomalar uchun. */
function ShowcaseSelect({ inv, disabled, onSelect }: { inv: AdminInvitation; disabled: boolean; onSelect: (state: ShowcaseState) => void }) {
  if (inv.status !== "published") return null;
  if (inv.hideFromShowcase) {
    return (
      <span
        title="Egasi taklifnomasini «Namunalar»da ko'rsatishni o'chirgan"
        className="mt-1.5 block w-fit whitespace-nowrap rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink/55"
      >
        Namunada yo'q (egasi o'chirgan)
      </span>
    );
  }
  const value: ShowcaseState = inv.showcaseHidden ? "hidden" : inv.featured ? "pinned" : "visible";
  const tone = value === "pinned" ? "amber" : value === "hidden" ? "gray" : "sky";
  return <StateSelect label="Namunalarda" value={value} options={SHOWCASE_OPTIONS} tone={tone} disabled={disabled} onSelect={onSelect} />;
}
