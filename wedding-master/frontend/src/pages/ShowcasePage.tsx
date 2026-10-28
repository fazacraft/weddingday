import { SiteFooter, SiteHeader } from "../platform/SiteChrome";
import { ShowcaseGrid, useShowcase } from "../platform/Showcase";
import { Eyebrow, PButton, PLink, Spinner } from "../platform/ui";

/** /namunalar — admin tanlagan barcha tayyor taklifnomalar. */
export function ShowcasePage() {
  const { items, total, loaded, loading, hasMore, loadMore } = useShowcase(24);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Eyebrow>Namunalar</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">Tayyor taklifnomalar</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
          Juftliklar biz bilan yaratgan haqiqiy taklifnomalar. Istalganini oching — mehmonlar uni aynan shunday ko'radi.
          {total > 0 && ` Jami: ${total} ta.`}
        </p>

        <div className="mt-10">
          {!loaded ? (
            <div className="flex justify-center py-16 text-ink/40"><Spinner className="h-6 w-6" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-white px-6 py-16 text-center">
              <p className="text-sm text-ink/55">Hozircha namunalar yo'q. Shablonlarni ko'rib chiqing.</p>
              <PLink to="/#shablonlar" className="mt-5" size="sm">Shablonlar →</PLink>
            </div>
          ) : (
            <ShowcaseGrid items={items} />
          )}
        </div>

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <PButton variant="secondary" loading={loading} onClick={loadMore}>
              Yana ko'rsatish
            </PButton>
          </div>
        )}

        <div className="mt-16 rounded-3xl bg-ink px-6 py-10 text-center text-ivory sm:px-10">
          <h2 className="font-display text-3xl font-semibold">O'zingiznikini yarating</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ivory/60">Shablonni tanlang, ma'lumotlarni kiriting va havolani mehmonlarga yuboring.</p>
          <PLink to="/yaratish" variant="secondary" className="mt-6">Taklifnoma yaratish</PLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
