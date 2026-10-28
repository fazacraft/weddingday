import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, mediaUrl } from "../../lib/api";
import { adminApi } from "../../lib/adminAuth";
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
  pending: number;
  wishes: number;
  rsvps: number;
  musicPending?: number;
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

type Tab = "taklifnomalar" | "foydalanuvchilar" | "musiqalar";
const TABS: Tab[] = ["taklifnomalar", "foydalanuvchilar", "musiqalar"];

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

        <div className="mt-8 flex gap-1 border-b border-ink/10">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === key ? "border-rose text-ink" : "border-transparent text-ink/45 hover:text-ink"
              }`}
            >
              {key}
              {key === "musiqalar" && !!stats?.musicPending && (
                <span className="ml-1.5 rounded-full bg-rose px-1.5 py-0.5 text-[10px] font-bold text-white">{stats.musicPending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === "taklifnomalar" ? (
            <InvitationsTab ownerFilter={params.get("owner")} onChange={loadStats} />
          ) : tab === "musiqalar" ? (
            <MusicTab onChange={loadStats} />
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

  const act = async (inv: AdminInvitation, kind: "toggle" | "delete" | "approve" | "reject" | "feature") => {
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
        await adminApi(`/admin/invitations/${inv.id}`, { method: "DELETE" });
      } else if (kind === "feature") {
        await adminApi(`/admin/invitations/${inv.id}/featured`, { method: "PATCH", body: { featured: !inv.featured } });
      } else if (kind === "approve" || kind === "reject") {
        await adminApi(`/admin/invitations/${inv.id}/review`, { method: "POST", body: { decision: kind } });
      } else {
        await adminApi(`/admin/invitations/${inv.id}`, {
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
          <option value="pending">Tasdiq kutmoqda</option>
          <option value="published">Nashrda</option>
          <option value="draft">Qoralama</option>
          <option value="featured">Namunalar</option>
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
                    <StatusBadge status={inv.status} review={inv.review} />
                    {inv.featured && inv.status === "published" && (
                      <span className="mt-1 block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">★ Namunada</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/55">
                    {inv.openCount} ochildi · {inv.replies} javob · {inv.wishes} tilak
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/45">{formatDateTime(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {inv.review === "pending" && inv.status !== "published" && (
                        <>
                          <button
                            disabled={busyId === inv.id}
                            onClick={() => void act(inv, "approve")}
                            className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            ✓ Tasdiqlash
                          </button>
                          <button
                            disabled={busyId === inv.id}
                            onClick={() => void act(inv, "reject")}
                            className="h-8 rounded-lg px-2.5 text-xs font-semibold text-ink/60 ring-1 ring-ink/10 hover:text-ink"
                          >
                            Rad etish
                          </button>
                        </>
                      )}
                      <button
                        disabled={busyId === inv.id || (!inv.featured && inv.status !== "published")}
                        onClick={() => void act(inv, "feature")}
                        title={
                          inv.featured
                            ? "Saytdagi «Namunalar»dan olib tashlash"
                            : inv.status === "published"
                              ? "Saytdagi «Namunalar»ga qo'shish"
                              : "Avval nashr qiling — faqat nashrdagi taklifnoma namuna bo'la oladi"
                        }
                        className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                          inv.featured
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "text-ink/60 ring-1 ring-ink/10 hover:text-ink"
                        }`}
                      >
                        {inv.featured ? "★ Namunada" : "☆ Namuna"}
                      </button>
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

interface AdminTrack {
  id: string;
  url: string;
  title: string;
  artist: string;
  durationSec: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  usedBy: number;
  submittedBy: { name: string; email: string } | null;
}

const TRACK_STATUS: Record<AdminTrack["status"], { label: string; className: string }> = {
  pending: { label: "Kutmoqda", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Ro'yxatda", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rad etilgan", className: "bg-ink/10 text-ink/60" },
};

/**
 * Foydalanuvchilar yuklagan musiqalar: admin eshitib, nomini tuzatib, umumiy
 * ro'yxatga qo'shadi (wizard'dagi "Fon musiqasi" ro'yxatida hammaga chiqadi).
 */
function MusicTab({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState("pending");
  const [tracks, setTracks] = useState<AdminTrack[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    adminApi<AdminTrack[]>(`/admin/music${status ? `?status=${status}` : ""}`)
      .then(setTracks)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, [status]);
  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm leading-relaxed text-ink/55">
          Foydalanuvchilar o'z taklifnomasiga yuklagan musiqalar. Eshitib ko'ring, nomini tuzating va ro'yxatga qo'shing —
          shundan keyin u hammaga «Fon musiqasi» ro'yxatida chiqadi.
        </p>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-ink/15 bg-white px-3 text-sm">
          <option value="pending">Kutmoqda</option>
          <option value="approved">Ro'yxatda</option>
          <option value="rejected">Rad etilgan</option>
          <option value="">Hammasi</option>
        </select>
      </div>
      {error && <Notice>{error}</Notice>}

      {!tracks ? (
        <div className="flex justify-center py-10 text-ink/40"><Spinner className="h-6 w-6" /></div>
      ) : tracks.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/45">Bu bo'limda musiqa yo'q.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onDone={() => {
                load();
                onChange();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrackCard({ track, onDone }: { track: AdminTrack; onDone: () => void }) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [duration, setDuration] = useState(track.durationSec);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = TRACK_STATUS[track.status];
  const edited = title !== track.title || artist !== track.artist;

  const save = async (nextStatus?: AdminTrack["status"]) => {
    setBusy(true);
    setError(null);
    try {
      await adminApi(`/admin/music/${track.id}`, {
        method: "PATCH",
        body: { title, artist, durationSec: duration, ...(nextStatus ? { status: nextStatus } : {}) },
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const used = track.usedBy ? ` U ${track.usedBy} ta taklifnomada ishlatilmoqda — fayl ular uchun saqlanib qoladi.` : "";
    if (!window.confirm(`«${title || "Nomsiz"}» musiqalar ro'yxatidan butunlay olib tashlansinmi?${used}`)) return;
    setBusy(true);
    try {
      await adminApi(`/admin/music/${track.id}`, { method: "DELETE" });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
      setBusy(false);
    }
  };

  const input = "h-10 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm focus:border-rose/60 focus:outline-none";
  const ghost = "h-9 rounded-lg px-3 text-xs font-semibold text-ink/60 ring-1 ring-ink/10 hover:text-ink disabled:opacity-50";

  return (
    <div className={`rounded-2xl border border-ink/10 bg-white p-4 ${busy ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span>
        <span className="text-xs text-ink/45">
          {track.submittedBy ? track.submittedBy.email : "foydalanuvchi o'chirilgan"} · {formatDateTime(track.createdAt)}
        </span>
      </div>

      <audio
        controls
        preload="metadata"
        src={mediaUrl(track.url)}
        className="mt-3 w-full"
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(Math.round(e.currentTarget.duration))}
        onPlay={(e) => document.querySelectorAll("audio").forEach((a) => a !== e.currentTarget && a.pause())}
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Qo'shiq nomi" maxLength={120} className={input} />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ijrochi (ixtiyoriy)" maxLength={120} className={input} />
      </div>
      <p className="mt-2 text-xs text-ink/45">
        {track.usedBy} ta taklifnomada ishlatilmoqda{duration ? ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : ""}
      </p>
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {track.status !== "approved" && (
          <button
            disabled={busy || !title.trim()}
            onClick={() => void save("approved")}
            className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            title={title.trim() ? undefined : "Avval qo'shiq nomini yozing"}
          >
            ✓ Ro'yxatga qo'shish
          </button>
        )}
        {track.status === "approved" && edited && (
          <button disabled={busy} onClick={() => void save()} className={ghost}>Saqlash</button>
        )}
        {track.status === "pending" && (
          <button disabled={busy} onClick={() => void save("rejected")} className={ghost}>Rad etish</button>
        )}
        {track.status === "approved" && (
          <button disabled={busy} onClick={() => void save("pending")} className={ghost}>Ro'yxatdan olish</button>
        )}
        <button
          disabled={busy}
          onClick={() => void remove()}
          className="ml-auto h-9 rounded-lg px-3 text-xs font-semibold text-rose ring-1 ring-rose/25 hover:bg-rose hover:text-white disabled:opacity-50"
        >
          O'chirish
        </button>
      </div>
    </div>
  );
}
