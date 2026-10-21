import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SiteFooter, SiteHeader } from "../platform/SiteChrome";
import { PhoneFrame } from "../platform/PhoneFrame";
import { TemplateThumb } from "../platform/TemplateThumb";
import { Eyebrow, PLink } from "../platform/ui";
import { TEMPLATE_LIST } from "../templates/registry";
import { SITE_DOMAIN, SITE_NAME } from "../lib/site";
import { withBase } from "../lib/base";

const STEPS = [
  { n: "01", title: "Shablonni tanlang", text: "Bog' yoki Anor — ikkalasini ham oldindan jonli ko'rib chiqing." },
  { n: "02", title: "Ma'lumotlarni kiriting", text: "Ismlar, sana, to'yxona, dastur, rasm va musiqa. Hammasi o'ng tomonda jonli ko'rinadi." },
  { n: "03", title: "Havolangizni oling", text: `${SITE_DOMAIN}/sizning-ismingiz — qisqa, chiroyli va faqat sizniki.` },
  { n: "04", title: "Mehmonlarga yuboring", text: "Telegram, Instagram yoki QR kod orqali. Javoblar va tilaklar kabinetingizga tushadi." },
];

const FEATURES = [
  { icon: "🔗", title: "Shaxsiy havola", text: "Har bir juftlik o'z manzilini oladi. Band yoki bo'shligini darhol ko'rsatamiz." },
  { icon: "💌", title: "Mehmon ismi bilan", text: "Havolaga ?name=Akmal qo'shsangiz, taklifnoma mehmonga ismi bilan murojaat qiladi." },
  { icon: "✅", title: "Kelaman / kelolmayman", text: "Mehmonlar javob beradi, siz kabinetda nechta odam kelishini ko'rasiz." },
  { icon: "🕊️", title: "Tilaklar devori", text: "Tabriklar real vaqtda paydo bo'ladi. Keraksizini kabinetdan o'chirasiz." },
  { icon: "📍", title: "Xarita va sanoq", text: "Google va Yandex xarita tugmalari, to'ygacha qolgan kun-soatlar." },
  { icon: "🎶", title: "Musiqa va rasm", text: "O'z qo'shig'ingiz va suratingizni yuklang yoki shablonnikini qoldiring." },
];

const FAQ = [
  {
    q: "Bu pullikmi?",
    a: "Yo'q. Taklifnoma yaratish, havola olish, tilaklar va javoblarni yig'ish bepul.",
  },
  {
    q: "Havolani keyin o'zgartirsa bo'ladimi?",
    a: "Ha, kabinetdagi tahrirlash bo'limidan. Faqat eski havolani yuborgan mehmonlarga yangisini qayta jo'natishni unutmang.",
  },
  {
    q: "Ro'yxatdan o'tmasdan boshlasa bo'ladimi?",
    a: "Ha. Wizard'ni to'ldirib, natijani ko'rib chiqasiz. Faqat nashr qilish paytida email bilan kirish so'raladi — qoralamangiz yo'qolmaydi.",
  },
  {
    q: "Mehmon ismini qanday qo'shaman?",
    a: `Havolaning oxiriga ?name= va ismni qo'shing: ${SITE_DOMAIN}/dilnoza-bekzod?name=Akmal aka. Kabinetda buning uchun tayyor generator bor.`,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-rose/[0.06] blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <Eyebrow>Onlayn to'y taklifnomasi</Eyebrow>
            <h1 className="mt-4 font-display text-[44px] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
              To'yingizga munosib
              <br />
              taklifnoma —{" "}
              <em className="font-medium text-rose">bir havolada.</em>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink/60">
              Shablonni tanlang, ismlar va sanani kiriting — 3 daqiqada mehmonlaringiz uchun shaxsiy
              taklifnoma sayti tayyor. Javoblar va tilaklar bitta kabinetda.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PLink to="/yaratish" size="lg">
                Bepul yaratish
                <span aria-hidden="true">→</span>
              </PLink>
              <a href="#shablonlar" className="inline-flex h-14 items-center justify-center rounded-full px-7 text-base font-semibold text-ink/70 hover:text-ink">
                Shablonlarni ko'rish
              </a>
            </div>

            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white py-2 pl-2 pr-5 shadow-sm">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sand text-sm">🔗</span>
              <span className="font-mono text-[13px] text-ink/50 sm:text-sm">
                {SITE_DOMAIN}/<span className="font-semibold text-ink">dilnoza-bekzod</span>
              </span>
            </div>
          </div>

          <div className="relative mx-auto h-[520px] w-full max-w-[440px]">
            <motion.div
              className="absolute right-0 top-6 w-[230px] rotate-6"
              initial={{ opacity: 0, y: 40, rotate: 12 }}
              animate={{ opacity: 1, y: 0, rotate: 6 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            >
              <PhoneFrame className="h-[470px]">
                <TemplateThumb template="anor" groom="Feruz" bride="Dilfuza" date="29.10.2026" className="h-full w-full" />
              </PhoneFrame>
            </motion.div>
            <motion.div
              className="absolute left-0 top-0 w-[240px] -rotate-3"
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <PhoneFrame className="h-[490px]">
                <TemplateThumb template="bog" className="h-full w-full" />
              </PhoneFrame>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Qanday ishlaydi ── */}
      <section id="qanday" className="scroll-mt-20 border-y border-ink/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Eyebrow>Qanday ishlaydi</Eyebrow>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            To'rt qadam — va taklifnomangiz mehmonlarda.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white p-7">
                <span className="font-display text-4xl font-semibold text-rose/80">{s.n}</span>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shablonlar ── */}
      <section id="shablonlar" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Shablonlar</Eyebrow>
              <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">Uch xil kayfiyat</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink/55">
              Har bir shablonni mehmon ko'zi bilan oching — musiqa, animatsiya va barcha bo'limlar bilan.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_LIST.map((tpl) => (
              <article key={tpl.key} className="group overflow-hidden rounded-[2rem] border border-ink/10 bg-white">
                <Link to={`/shablonlar/${tpl.key}`} className="block">
                  <TemplateThumb
                    template={tpl.key}
                    className="h-[340px] w-full transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </Link>
                <div className="p-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-3xl font-semibold text-ink">{tpl.name}</h3>
                    <div className="flex -space-x-1.5">
                      {tpl.palette.map((c) => (
                        <span key={c} className="h-5 w-5 rounded-full border-2 border-white" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm font-medium text-rose">{tpl.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/55">{tpl.description}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <PLink to={`/yaratish?shablon=${tpl.key}`} size="sm">
                      Shu shablon bilan yaratish
                    </PLink>
                    <PLink to={`/shablonlar/${tpl.key}`} variant="secondary" size="sm">
                      ▶ Ko'rish
                    </PLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Imkoniyatlar ── */}
      <section className="bg-ink text-ivory">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Ichida nimalar bor</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Mehmonga chiroyli, sizga qulay.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl border border-ivory/10 bg-ivory/[0.03] p-6">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/55">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Savollar ── */}
      <section id="savollar" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Savollar</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">Ko'p so'raladi</h2>
          </div>
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold text-ink">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/15 text-ink/50 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm leading-relaxed text-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-rose px-6 py-16 text-center text-ivory sm:px-12">
          <img src={withBase("/templates/anor/pomegranate-vine.svg")} alt="" className="pointer-events-none absolute -left-10 top-1/2 h-[140%] -translate-y-1/2 opacity-10 invert" />
          <img src={withBase("/templates/anor/pomegranate-vine.svg")} alt="" className="pointer-events-none absolute -right-10 top-1/2 h-[140%] -translate-y-1/2 -scale-x-100 opacity-10 invert" />
          <h2 className="relative font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Havolangiz 3 daqiqada tayyor.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-ivory/75">
            {SITE_NAME} bilan mehmonlaringiz taklifnomani telefonida ochadi, xaritani bosadi va tilak qoldiradi.
          </p>
          <Link
            to="/yaratish"
            className="relative mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-ivory px-8 font-semibold text-rose transition-transform hover:scale-[1.03]"
          >
            Taklifnoma yaratish <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
