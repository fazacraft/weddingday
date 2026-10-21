import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { inviteLabel, inviteUrl } from "../../lib/site";
import { useAuth } from "../../context/AuthContext";
import type { OwnedInvitation } from "../../types/invitation";
import { TEMPLATES } from "../../templates/registry";
import { SiteHeader } from "../../platform/SiteChrome";
import { TemplateThumb } from "../../platform/TemplateThumb";
import { Eyebrow, Notice, PLink, Spinner } from "../../platform/ui";
import { CopyButton, StatusBadge, daysUntil, formatDate } from "./shared";
import { withBase } from "../../lib/base";

export function DashboardPage() {
  const { user } = useAuth();
  const [list, setList] = useState<OwnedInvitation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<OwnedInvitation[]>("/invitations")
      .then(setList)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi"));
  }, []);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Kabinet</Eyebrow>
            <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
              Assalomu alaykum, {user?.name}
            </h1>
          </div>
          <PLink to="/yaratish">+ Yangi taklifnoma</PLink>
        </div>

        {error && <div className="mt-8"><Notice>{error}</Notice></div>}

        {!list && !error && (
          <div className="mt-16 flex justify-center text-ink/40"><Spinner className="h-6 w-6" /></div>
        )}

        {list && list.length === 0 && (
          <div className="mt-10 rounded-[2rem] border border-dashed border-ink/20 bg-white px-6 py-16 text-center">
            <p className="font-display text-3xl font-semibold text-ink">Hali taklifnoma yo'q</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink/55">
              Birinchi taklifnomangizni yarating — javoblar va tilaklar shu yerda yig'iladi.
            </p>
            <PLink to="/yaratish" className="mt-6">Taklifnoma yaratish</PLink>
          </div>
        )}

        {list && list.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {list.map((inv) => {
              const left = daysUntil(inv.date);
              return (
                <article key={inv.id} className="flex flex-col overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white sm:flex-row">
                  <Link to={`/kabinet/${inv.id}`} className="block shrink-0 sm:w-40">
                    <TemplateThumb
                      template={inv.template}
                      groom={inv.groomName}
                      bride={inv.brideName}
                      date={formatDate(inv.date)}
                      className="h-44 w-full sm:h-full"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-display text-2xl font-semibold text-ink">
                          {inv.groomName} & {inv.brideName}
                        </h2>
                        <p className="text-xs text-ink/50">
                          {formatDate(inv.date)} · {inv.time} · {TEMPLATES[inv.template]?.name}
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-sand/50 py-1.5 pl-3 pr-1.5">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink/70">{inviteLabel(inv.slug)}</span>
                      <CopyButton text={inviteUrl(inv.slug)} />
                    </div>

                    <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                      {[
                        ["Ochildi", inv.openCount],
                        ["Keladi", inv.stats?.coming ?? 0],
                        ["Tilak", inv.stats?.wishes ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-ink/5 py-2">
                          <dd className="text-lg font-bold text-ink">{value}</dd>
                          <dt className="text-[10px] uppercase tracking-wider text-ink/45">{label}</dt>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-ink/45">
                        {left > 0 ? `To'yga ${left} kun qoldi` : left === 0 ? "To'y bugun!" : "To'y o'tdi"}
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={withBase(inv.slug)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-semibold text-ink/60 hover:text-ink"
                        >
                          Ochish ↗
                        </a>
                        <PLink to={`/kabinet/${inv.id}`} size="sm" variant="secondary">
                          Boshqarish
                        </PLink>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
