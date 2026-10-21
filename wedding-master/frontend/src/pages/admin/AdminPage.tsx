import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { withBase } from "../../lib/base";
import { TEMPLATES } from "../../templates/registry";
import type { TemplateKey } from "../../types/invitation";
import { SiteHeader } from "../../platform/SiteChrome";
import { Eyebrow, Notice, PButton, Spinner } from "../../platform/ui";
import { StatusBadge, formatDate, formatDateTime } from "../dashboard/shared";

interface AdminStats {
  users: number;
  invitations: number;
  published: number;
  wishes: number;
  rsvps: number;
}

interface AdminInvitation {
  id: string;
  slug: string;
  template: TemplateKey;
  status: "draft" | "published";
  groomName: string;
  brideName: string;
  date: string;
  venueName: string;
  openCount: number;
  createdAt: string;
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

type Tab = "taklifnomalar" | "foydalanuvchilar";

export function AdminPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "foydalanuvchilar" ? "foydalanuvchilar" : "taklifnomalar";
  const [stats, setStats] = useState<AdminStats | null>(null);

  const loadStats = useCallback(() => {
    api<AdminStats>("/admin/stats").then(setStats).catch(() => setStats(null));
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
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">Boshqaruv paneli</h1>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Foydalanuvchi", stats?.users],
            ["Taklifnoma", stats?.invitations],
            ["Nashrda", stats?.published],
            ["Tilak", stats?.wishes],
            ["Javob (RSVP)", stats?.rsvps],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">{label}</p>
              <p className="mt-1 font-display text-3xl font-semibold text-ink">{value ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-1 border-b border-ink/10">
          {(["taklifnomalar", "foydalanuvchilar"] as Tab[]).map((key) => (
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
    api<Paged<T>>(`${path}${qs ? `?${qs}` : ""}`)
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

  const act = async (inv: AdminInvitation, kind: "toggle" | "delete") => {
    if (kind === "delete") {
      const ok = window.confirm(
        `"${inv.groomName} & ${inv.brideName}" (/${inv.slug}) butunlay o'chirilsinmi?\nTilaklar, javoblar va yuklangan rasm/musiqa ham o'chadi. Qaytarib bo'lmaydi.`
      );
      if (!ok) return;
    }
    setBusyId(inv.id);
    setActionError(null);
    try {
      if (kind === "delete") {
        await api(`/admin/invitations/${inv.id}`, { method: "DELETE" });
      } else {
        await api(`/admin/invitations/${inv.id}`, {
          method: "PATCH",
          body: { status: inv.status === "published" ? "draft" : "published" },
        });
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
          <option value="published">Nashrda</option>
          <option value="draft">Qoralama</option>
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
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-xs text-ink/55">
                    {inv.openCount} ochildi · {inv.replies} javob · {inv.wishes} tilak
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/45">{formatDateTime(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href={withBase(inv.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink"
                      >
                        Ochish ↗
                      </a>
                      <button
                        disabled={busyId === inv.id}
                        onClick={() => void act(inv, "toggle")}
                        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-ink/60 ring-1 ring-ink/10 hover:text-ink"
                      >
                        {inv.status === "published" ? "Yashirish" : "Nashr"}
                      </button>
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

  const remove = async (user: AdminUser) => {
    const ok = window.confirm(
      `${user.email} hisobi va uning ${user.invitations} ta taklifnomasi butunlay o'chirilsinmi? Qaytarib bo'lmaydi.`
    );
    if (!ok) return;
    setBusyId(user.id);
    setActionError(null);
    try {
      await api(`/admin/users/${user.id}`, { method: "DELETE" });
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
                  <td className="px-4 py-3 text-right">
                    {!u.isAdmin && (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => void remove(u)}
                        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-rose ring-1 ring-rose/25 hover:bg-rose hover:text-white"
                      >
                        O'chirish
                      </button>
                    )}
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
