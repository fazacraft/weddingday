import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useInvitation } from "../shared/InvitationContext";
import { useCountOpen, useRsvp } from "../shared/useRsvp";
import { useWishes } from "../shared/useWishes";
import { UZ_MONTHS, UZ_WEEKDAYS, envelopeLines, monthGrid, useCountdown } from "../shared/calendar";
import { useReveal } from "../shared/useReveal";
import {
  AcornMark,
  AutumnGarland,
  CornerSprig,
  LeafCluster,
  LeafColor,
  LeafDivider,
  LeafIcon,
  LeafKind,
  LeafWreath,
  MapleShape,
  SealLeaf,
} from "./ornaments";
import "./kuz.css";

const OPENING_DURATION_MS = 2100;
const FADE_DURATION_MS = 900;
const MUSIC_VOLUME = 0.2;

const UZ_WEEKDAY_NAMES = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const QUOTES = [
  {
    text: "U zot sizlar uchun o'zlaringizdan juftlar yaratdi, ular bilan taskin topishingiz uchun, orangizda mehr va rahmat paydo qildi.",
    ref: "Ar-Rum, 30:21",
  },
  { text: "Ular sizlar uchun libos, sizlar ham ular uchun libossiz.", ref: "Al-Baqara, 2:187" },
];

/** Shamolda tushayotgan kuz barglari — har biri tushadi, chayqaladi va aylanadi (faqat CSS). */
const LEAVES: { left: number; size: number; dur: number; delay: number; sway: number; kind: LeafKind; color: LeafColor }[] = [
  { left: 3, size: 26, dur: 13, delay: 0, sway: 40, kind: "maple", color: "rust" },
  { left: 12, size: 18, dur: 15, delay: 4, sway: -34, kind: "birch", color: "gold" },
  { left: 21, size: 24, dur: 12, delay: 7.5, sway: 52, kind: "oak", color: "olive" },
  { left: 30, size: 20, dur: 16, delay: 2, sway: -46, kind: "maple", color: "amber" },
  { left: 41, size: 28, dur: 14, delay: 10, sway: 36, kind: "maple", color: "crimson" },
  { left: 50, size: 17, dur: 13.5, delay: 5, sway: -40, kind: "birch", color: "amber" },
  { left: 59, size: 25, dur: 12.5, delay: 12, sway: 48, kind: "oak", color: "brown" },
  { left: 68, size: 22, dur: 15.5, delay: 1, sway: -56, kind: "maple", color: "pumpkin" },
  { left: 77, size: 19, dur: 13, delay: 8.5, sway: 42, kind: "birch", color: "gold" },
  { left: 86, size: 27, dur: 14.5, delay: 3, sway: -36, kind: "maple", color: "rust" },
  { left: 94, size: 20, dur: 12, delay: 11, sway: 30, kind: "oak", color: "pumpkin" },
  { left: 36, size: 16, dur: 14, delay: 14, sway: 58, kind: "birch", color: "olive" },
];

/** Karta ochilganda ichidan uchib chiqadigan barglar: (dx, dy) — siljish, r — aylanish. */
const BURST: { dx: number; dy: number; r: number; size: number; kind: LeafKind; color: LeafColor; delay: number }[] = [
  { dx: -150, dy: -190, r: -260, size: 26, kind: "maple", color: "rust", delay: 0.45 },
  { dx: 160, dy: -170, r: 300, size: 24, kind: "maple", color: "amber", delay: 0.5 },
  { dx: -190, dy: 40, r: 200, size: 20, kind: "oak", color: "olive", delay: 0.55 },
  { dx: 200, dy: 70, r: -220, size: 22, kind: "birch", color: "gold", delay: 0.5 },
  { dx: -90, dy: 230, r: 320, size: 18, kind: "maple", color: "crimson", delay: 0.6 },
  { dx: 110, dy: 240, r: -300, size: 24, kind: "oak", color: "pumpkin", delay: 0.55 },
  { dx: 20, dy: -250, r: 240, size: 20, kind: "birch", color: "amber", delay: 0.65 },
  { dx: -230, dy: -60, r: -180, size: 22, kind: "maple", color: "pumpkin", delay: 0.6 },
  { dx: 240, dy: -40, r: 260, size: 18, kind: "maple", color: "brown", delay: 0.65 },
];

type Phase = "closed" | "opening" | "fading" | "open";

function dateParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  const weekday = UZ_WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  // Sentabr–noyabr: "oltin kuz" belgisi faqat haqiqatan kuz faslida chiqadi
  const autumn = m >= 9 && m <= 11;
  return { day: String(d).padStart(2, "0"), month: UZ_MONTHS[m - 1], year: y, weekday, autumn };
}

function initial(name: string, fallback: string) {
  return (name.trim()[0] || fallback).toUpperCase();
}

/** "Kuz" shabloni — oltin-zang ranglar, kanop ip bilan bog'langan kraft karta, chinor barglari. */
export default function KuzTemplate() {
  const { data, weddingAt, paragraphs, couplePhoto, musicUrl, guestName } = useInvitation();
  const countOpen = useCountOpen();
  const [phase, setPhase] = useState<Phase>("closed");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const grid = useMemo(() => monthGrid(data.date), [data.date]);
  const parts = useMemo(() => dateParts(data.date), [data.date]);
  const left = useCountdown(weddingAt);
  const markIndex = Math.floor((data.schedule.length + 1) / 2) - 1;

  // Karta yopiq turganda sahifa aylantirilmaydi
  useEffect(() => {
    if (phase === "open" || phase === "fading") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useReveal(rootRef, phase === "fading" || phase === "open", [phase, data]);

  const playMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = MUSIC_VOLUME;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playMusic();
    else {
      audio.pause();
      setPlaying(false);
    }
  };

  const openInvitation = () => {
    if (phase !== "closed") return;
    playMusic();
    countOpen();
    setPhase("opening");
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      setPhase("fading");
      window.setTimeout(() => setPhase("open"), FADE_DURATION_MS);
    }, OPENING_DURATION_MS);
  };

  const groom = data.groomName || "Kuyov";
  const bride = data.brideName || "Kelin";
  const names = `${groom} va ${bride}`;
  // Pinyon Script'ning "&" belgisi o'qilmaydi — uni Playfair italic bilan chiqaramiz
  const monogram = (
    <>
      {initial(data.groomName, "K")}
      <span className="mono-amp">&amp;</span>
      {initial(data.brideName, "K")}
    </>
  );

  return (
    <div className="tpl-kuz" ref={rootRef}>
      <div className="leaves" aria-hidden="true">
        {LEAVES.map((l, i) => (
          <span
            key={i}
            className="leaf-fall"
            style={{ left: `${l.left}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}
          >
            <span
              className="leaf-sway"
              style={{ "--sway": `${l.sway}px`, animationDuration: `${l.dur / 2.6}s`, animationDelay: `${l.delay}s` } as CSSProperties}
            >
              <LeafIcon
                kind={l.kind}
                color={l.color}
                className="leaf-spin"
                style={{ width: l.size, height: l.size, animationDuration: `${l.dur / 3}s`, animationDelay: `${l.delay}s` }}
              />
            </span>
          </span>
        ))}
      </div>

      {phase !== "closed" && (
        <button
          className={`music-toggle${playing ? " is-playing" : ""}`}
          type="button"
          onClick={toggleMusic}
          aria-pressed={playing}
          aria-label={playing ? "Musiqani to'xtatish" : "Musiqani yoqish"}
          title={playing ? "Musiqani to'xtatish" : "Musiqani yoqish"}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      )}
      <audio ref={audioRef} src={musicUrl} preload="auto" loop />

      {phase !== "open" && (
        <section
          className={`intro${phase !== "closed" ? " opened" : ""}${phase === "fading" ? " fade-out" : ""}`}
          aria-label="Taklifnoma kartasi"
        >
          <div className="intro-glow" aria-hidden="true" />

          <div className="intro-eyebrow">
            <span className="intro-rule" />
            <span>{data.eventTitle || "To'y"} taklifnomasi</span>
            <span className="intro-rule" />
          </div>

          <div className="gatefold">
            {/* Eshiklar ortidagi ichki sahifa — ochilganda ko'rinadi */}
            <div className="gatefold-inner" aria-hidden="true">
              <AutumnGarland className="inner-garland" />
              <span className="inner-monogram">{monogram}</span>
              <span className="inner-welcome">xush kelibsiz</span>
            </div>

            <div className="door door-left">
              <div className="door-face door-front">
                <CornerSprig className="door-sprig door-sprig--top" />
              </div>
              <div className="door-face door-back" />
            </div>
            <div className="door door-right">
              <div className="door-face door-front">
                <CornerSprig className="door-sprig door-sprig--bottom" />
              </div>
              <div className="door-face door-back" />
            </div>

            <div className="tag">
              <span className="tag-hole" aria-hidden="true" />
              <p className="tag-lines">
                {envelopeLines(data.eventTitle).map((line) => (
                  <span className="tag-line" key={line}>{line}</span>
                ))}
              </p>
              <p className="tag-names">
                {groom}
                <span className="tag-amp">&amp;</span>
                {bride}
              </p>
              <span className="tag-script">taklif etamiz</span>
            </div>

            <span className="twine" aria-hidden="true" />
            <svg className="twine-bow" viewBox="0 0 120 60" aria-hidden="true">
              <path d="M60 30 C40 6 14 10 16 28 C18 44 42 40 60 30Z" />
              <path d="M60 30 C80 6 106 10 104 28 C102 44 78 40 60 30Z" />
              <path d="M58 32 C52 44 46 52 38 58 M62 32 C68 44 74 52 82 58" fill="none" />
            </svg>

            <button
              className="seal-button"
              type="button"
              onClick={openInvitation}
              aria-expanded={phase !== "closed"}
              aria-label="Taklifnomani ochish"
            >
              <SealLeaf className="seal-leaf" />
              <span className="seal-monogram">{monogram}</span>
            </button>

            <div className="burst" aria-hidden="true">
              {BURST.map((b, i) => (
                <span
                  key={i}
                  className="burst-leaf"
                  style={{ "--dx": `${b.dx}px`, "--dy": `${b.dy}px`, "--r": `${b.r}deg`, animationDelay: `${b.delay}s` } as CSSProperties}
                >
                  <LeafIcon kind={b.kind} color={b.color} style={{ width: b.size, height: b.size }} />
                </span>
              ))}
            </div>
          </div>

          <p className="intro-hint">Muhrni bosing — ip yechilib, taklifnoma ochiladi</p>
        </section>
      )}

      <main className="invitation" aria-hidden={phase === "closed" || phase === "opening"}>
        <section className="hero reveal">
          <AutumnGarland className="hero-garland" />

          {guestName && (
            <p className="guest-greeting">
              Assalomu alaykum, hurmatli
              <strong>{guestName}</strong>
            </p>
          )}

          <p className="hero-eyebrow">{data.eventTitle || "To'y"} taklifnomasi</p>

          <h1 className="hero-names">
            <span>{groom}</span>
            <span className="hero-amp">&amp;</span>
            <span>{bride}</span>
          </h1>

          {parts && (
            <div className="hero-date" aria-label="To'y sanasi">
              <span className="hero-date-side">{parts.weekday}</span>
              <span className="hero-date-day">
                {parts.day}
                <LeafIcon kind="maple" color="amber" className="hero-date-leaf" />
              </span>
              <span className="hero-date-side">
                {parts.month}
                <br />
                {parts.year}
              </span>
            </div>
          )}
          {parts?.autumn && (
            <p className="season-badge">
              <LeafIcon kind="oak" color="rust" className="season-badge-leaf" />
              oltin kuz faslida
            </p>
          )}

          <div className="portrait">
            <LeafWreath className="portrait-wreath" />
            <div className="portrait-frame">
              {couplePhoto ? (
                <img src={couplePhoto} alt={names} />
              ) : (
                <div className="portrait-placeholder" aria-hidden="true">
                  <span className="portrait-monogram">{monogram}</span>
                  <span className="portrait-time">soat {data.time}</span>
                </div>
              )}
            </div>
          </div>

          {data.venueName && <p className="hero-venue">{data.venueName}</p>}

          <a className="scroll-indicator" href="#kuz-letter">
            <span>Pastga tushuring</span>
            <LeafIcon kind="maple" color="rust" className="scroll-leaf" />
          </a>
        </section>

        {(data.greetingHeading || paragraphs.length > 0) && (
          <section className="letter reveal" id="kuz-letter">
            {data.greetingHeading && <h2 className="section-title">{data.greetingHeading}</h2>}
            <LeafDivider />
            <div className="lead">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        <section className="quotes" aria-label="Oyatlar">
          {QUOTES.map((q) => (
            <figure className="quote-card reveal" key={q.ref}>
              <span className="quote-mark" aria-hidden="true">&ldquo;</span>
              <blockquote>{q.text}</blockquote>
              <figcaption>{q.ref}</figcaption>
            </figure>
          ))}
        </section>

        <div className="details">
          {grid && (
            <section className="card calendar-card reveal" aria-label="To'y sanasi">
              <LeafCluster className="card-cluster card-cluster--left" />
              <h2 className="card-title">Baxtli kunimiz</h2>
              <div className="calendar" role="img" aria-label={`${grid.label} kalendari`}>
                <div className="calendar-head">{grid.label}</div>
                <div className="calendar-grid week-days">
                  {UZ_WEEKDAYS.map((wd) => <span key={wd}>{wd}</span>)}
                </div>
                {grid.weeks.map((week, wi) => (
                  <div className="calendar-grid days" key={wi}>
                    {week.map((day, di) =>
                      day === grid.day ? (
                        <span className="leaf-day" key={di} aria-label="To'y kuni">
                          <MapleShape className="leaf-day-bg" />
                          <b>{day}</b>
                        </span>
                      ) : (
                        <span key={di}>{day || ""}</span>
                      )
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card location-card reveal" aria-label="To'y manzili">
            <LeafCluster className="card-cluster card-cluster--right" />
            <h2 className="card-title">To'y manzili</h2>
            <p className="venue-name">{data.venueName || "To'yxona nomi"}</p>
            {data.venueAddress && <p className="muted">{data.venueAddress}</p>}
            {data.venueLandmark && <p className="muted">Mo'ljal: {data.venueLandmark}</p>}
            <p className="venue-time">Soat {data.time}</p>
            {data.dressCode && (
              <p className="dress-code">
                <span>Dress-kod</span>
                {data.dressCode}
              </p>
            )}
            {(data.yandexMapUrl || data.googleMapUrl) && (
              <div className="pill-row">
                {data.yandexMapUrl && (
                  <a className="pill" href={data.yandexMapUrl} target="_blank" rel="noopener noreferrer">Yandex xaritasi</a>
                )}
                {data.googleMapUrl && (
                  <a className="pill" href={data.googleMapUrl} target="_blank" rel="noopener noreferrer">Google Maps</a>
                )}
              </div>
            )}
          </section>

          <section className="countdown-card reveal" aria-label="Orqaga sanoq">
            <LeafIcon kind="maple" color="amber" className="countdown-leaf countdown-leaf--a" />
            <LeafIcon kind="oak" color="gold" className="countdown-leaf countdown-leaf--b" />
            <LeafIcon kind="maple" color="pumpkin" className="countdown-leaf countdown-leaf--c" />
            <h2 className="section-title section-title--light">To'yga qadar</h2>
            <div className="countdown" role="timer">
              {[
                [left.days, "Kun"],
                [left.hours, "Soat"],
                [left.minutes, "Daqiqa"],
                [left.seconds, "Soniya"],
              ].map(([value, label]) => (
                <div className="time-unit" key={label}>
                  <span>{String(value).padStart(2, "0")}</span>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <p className="countdown-message">
              {left.done ? "Bugun aynan o'sha kun. Sizni kutamiz!" : "Har bir lahzani intiqlik bilan sanayapmiz"}
            </p>
          </section>

          {data.schedule.length > 0 && (
            <section className="card schedule-card reveal" aria-label="To'y dasturi">
              <h2 className="card-title">To'y dasturi</h2>
              <div className="timeline">
                {data.schedule.map((item, i) => (
                  <div className="timeline-item" key={`${item.time}-${i}`}>
                    <span className="timeline-time">{item.time}</span>
                    <span className={`timeline-marker${i === markIndex ? " timeline-marker--acorn" : ""}`} aria-hidden="true">
                      {i === markIndex && <AcornMark className="timeline-acorn" />}
                    </span>
                    <span className="timeline-title">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.features.rsvp && <KuzRsvp />}
          {data.features.gift && data.cardNumber && <KuzGift />}
          {data.features.wishes && <KuzWishes />}
        </div>

        <footer className="footer reveal">
          <AutumnGarland className="footer-garland" />
          <p className="footer-note">muhabbat ila,</p>
          <p className="footer-names">{names}</p>
          {parts && <p className="footer-date">{parts.day} · {parts.month} · {parts.year}</p>}
        </footer>
      </main>
    </div>
  );
}

function KuzRsvp() {
  const { guestName } = useInvitation();
  const { submit, submitting, error, sent, reset } = useRsvp();
  const [name, setName] = useState(guestName);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState(1);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (attending === null) return;
    void submit({ name: name.trim(), attending, guests });
  };

  return (
    <section className="card rsvp-card reveal" aria-label="Javobingiz">
      <h2 className="card-title">Kelasizmi?</h2>
      {sent ? (
        <>
          <p className="thanks">Rahmat!</p>
          <p className="muted">
            {sent.attending ? "Sizni intiqlik bilan kutamiz." : "Afsus! Duolaringiz biz bilan bo'lsin."}
          </p>
          <button type="button" className="text-link" onClick={reset}>Javobni o'zgartirish</button>
        </>
      ) : (
        <>
          <p className="card-subtitle">Tayyorgarlik ko'rishimiz uchun javobingizni bildiring</p>
          <form className="form" onSubmit={onSubmit}>
            <input
              className="input"
              placeholder="Ismingiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
            <div className="choice">
              <button type="button" className={attending === true ? "is-active" : ""} onClick={() => setAttending(true)} aria-pressed={attending === true}>
                Albatta kelaman
              </button>
              <button type="button" className={attending === false ? "is-active" : ""} onClick={() => setAttending(false)} aria-pressed={attending === false}>
                Kela olmayman
              </button>
            </div>
            {attending && (
              <label className="form-row">
                Necha kishi bo'lasiz?
                <select className="input" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="button" type="submit" disabled={submitting || attending === null || !name.trim()}>
              {submitting ? "Yuborilmoqda..." : "Javob yuborish"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

function KuzGift() {
  const { data } = useInvitation();
  const [copied, setCopied] = useState(false);
  const raw = data.cardNumber.replace(/\s/g, "");
  const formatted = raw.replace(/(.{4})/g, "$1 ").trim();

  const copy = () => {
    void navigator.clipboard?.writeText(raw).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <section className="card gift-card reveal" aria-label="To'yona">
      <h2 className="card-title">To'yona</h2>
      <p className="card-subtitle">E'tiboringiz uchun minnatdormiz</p>
      <div className="bank-card">
        <LeafIcon kind="maple" color="amber" className="bank-card-leaf" />
        <span className="bank-card-chip" aria-hidden="true" />
        <p className="bank-card-number">{formatted}</p>
        {data.cardHolder && <p className="bank-card-holder">{data.cardHolder}</p>}
      </div>
      <button type="button" className="pill" onClick={copy}>
        {copied ? "Nusxalandi ✓" : "Raqamni nusxalash"}
      </button>
    </section>
  );
}

function KuzWishes() {
  const { wishes, loading, submitting, error, submitWish } = useWishes();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (await submitWish(name.trim(), message.trim())) {
      setName("");
      setMessage("");
    }
  };

  return (
    <section className="card wishes-card reveal" aria-label="Tilaklar">
      <h2 className="card-title">Tilak va tabriklar</h2>
      <p className="card-subtitle">Yangi oilaga eng samimiy tilaklaringizni qoldiring</p>
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <input className="input" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <textarea className="input" placeholder="Tilagingiz..." value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} />
        {error && <p className="form-error">{error}</p>}
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Yuborilmoqda..." : "Tilak qoldirish"}
        </button>
      </form>

      {loading ? (
        <p className="wish-empty">Yuklanmoqda...</p>
      ) : wishes.length === 0 ? (
        <p className="wish-empty">Hali tilaklar yo'q. Birinchi bo'ling!</p>
      ) : (
        <ul className="wish-list">
          {wishes.map((w) => (
            <li className="wish-item" key={w._id}>
              <LeafIcon kind="maple" color={(["rust", "amber", "olive", "crimson"] as const)[w.name.length % 4]} className="wish-leaf" />
              <p className="wish-name">{w.name}</p>
              <p className="wish-text">{w.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
