import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useInvitation } from "../shared/InvitationContext";
import { useCountOpen, useRsvp } from "../shared/useRsvp";
import { useWishes } from "../shared/useWishes";
import { UZ_MONTHS, UZ_WEEKDAYS, envelopeLines, monthGrid, useCountdown } from "../shared/calendar";
import { useReveal } from "../shared/useReveal";
import { useSlotFocus } from "../shared/useSlotFocus";
import { HeartShape, RoseBranch, RoseCluster, RoseDivider, RoseGarland, RoseMark } from "./ornaments";
import "./atirgul.css";

const OPENING_DURATION_MS = 1700;
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

/** Tushayotgan atirgul yaproqlari ("Bog'" shablonidagi kabi, faqat CSS bilan). */
const PETALS = [
  { left: 4, size: 14, dur: 11, delay: 0, sway: 34, tone: 0 },
  { left: 13, size: 10, dur: 13, delay: 3, sway: -26, tone: 1 },
  { left: 22, size: 17, dur: 10, delay: 6, sway: 48, tone: 2 },
  { left: 31, size: 12, dur: 14, delay: 1.5, sway: -40, tone: 0 },
  { left: 42, size: 15, dur: 12, delay: 8, sway: 30, tone: 1 },
  { left: 51, size: 11, dur: 11.5, delay: 4, sway: -36, tone: 2 },
  { left: 60, size: 18, dur: 10.5, delay: 9.5, sway: 44, tone: 0 },
  { left: 69, size: 13, dur: 13.5, delay: 2, sway: -50, tone: 1 },
  { left: 78, size: 15, dur: 11, delay: 5.5, sway: 38, tone: 2 },
  { left: 87, size: 11, dur: 12.5, delay: 7, sway: -30, tone: 0 },
  { left: 95, size: 16, dur: 10, delay: 11, sway: 26, tone: 1 },
  { left: 36, size: 13, dur: 12, delay: 12.5, sway: 52, tone: 2 },
];
const PETAL_COLORS = ["#f6b8c6", "#fbd5de", "#e994a9"];

type Phase = "closed" | "opening" | "fading" | "open";

function dateParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  const weekday = UZ_WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { day: String(d).padStart(2, "0"), month: UZ_MONTHS[m - 1], year: y, weekday };
}

function initial(name: string, fallback: string) {
  return (name.trim()[0] || fallback).toUpperCase();
}

/** "Atirgul" shabloni — oq va pushti ranglar, muhrli konvert, atirgul novdalari, tushayotgan yaproqlar. */
export default function AtirgulTemplate() {
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

  // Konvert yopiq turganda sahifa aylantirilmaydi
  useEffect(() => {
    if (phase === "open" || phase === "fading") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useReveal(rootRef, phase === "fading" || phase === "open", [phase, data]);
  useSlotFocus(() => setPhase("open"));

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
  const monogram = `${initial(data.groomName, "K")}&${initial(data.brideName, "K")}`;

  return (
    <div className="tpl-atirgul" ref={rootRef}>
      <div className="petals" aria-hidden="true">
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="petal-fall"
            style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
          >
            <span
              className="petal"
              style={
                {
                  "--sway": `${p.sway}px`,
                  width: p.size,
                  height: Math.round(p.size * 1.3),
                  background: PETAL_COLORS[p.tone],
                  animationDuration: `${p.dur / 2.2}s`,
                  animationDelay: `${p.delay}s`,
                } as CSSProperties
              }
            />
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
          aria-label="Taklifnoma konverti"
        >
          <RoseBranch className="intro-branch intro-branch--left" />
          <RoseBranch className="intro-branch intro-branch--right" />

          <div className="intro-eyebrow">
            <span className="intro-rule" />
            <span>{data.eventTitle || "To'y"} taklifnomasi</span>
            <span className="intro-rule" />
          </div>

          <div className="envelope-stage">
            <div className="envelope-letter" aria-hidden="true">
              <RoseGarland className="letter-garland" />
              <span className="letter-names">{groom} &amp; {bride}</span>
            </div>
            <div className="flap flap-left" />
            <div className="flap flap-right" />
            <div className="flap flap-bottom">
              <p className="flap-signature">
                muhabbat ila,
                <br />
                <strong>{names}</strong>
              </p>
            </div>
            <div className="flap flap-top">
              <p className="flap-note">
                {envelopeLines(data.eventTitle).map((line) => (
                  <span className="flap-note-line" key={line}>{line}</span>
                ))}
                <span className="flap-note-script">taklif etamiz</span>
              </p>
            </div>
            <button
              className="seal-button"
              type="button"
              onClick={openInvitation}
              aria-expanded={phase !== "closed"}
              aria-label="Taklifnomani ochish"
            >
              <span className="seal-monogram">{monogram}</span>
            </button>
          </div>

          <p className="intro-hint">Muhrni bosing — taklifnoma musiqa bilan ochiladi</p>
        </section>
      )}

      <main className="invitation" aria-hidden={phase === "closed" || phase === "opening"}>
        <RoseBranch className="side-branch side-branch--left" />
        <RoseBranch className="side-branch side-branch--right" />

        <section className="hero reveal">
          <RoseGarland className="hero-garland" />

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
              <span className="hero-date-day">{parts.day}</span>
              <span className="hero-date-side">
                {parts.month}
                <br />
                {parts.year}
              </span>
            </div>
          )}

          <div className="arch">
            <RoseCluster className="arch-cluster arch-cluster--top" />
            <div className="arch-frame" data-slot="couple">
              {couplePhoto ? (
                <img src={couplePhoto} alt={names} />
              ) : (
                <div className="arch-placeholder" aria-hidden="true">
                  <span className="arch-monogram">{monogram}</span>
                  <span className="arch-time">soat {data.time}</span>
                </div>
              )}
            </div>
            <RoseCluster className="arch-cluster arch-cluster--bottom" />
          </div>

          {data.venueName && <p className="hero-venue">{data.venueName}</p>}

          <a className="scroll-indicator" href="#atirgul-letter">
            <span>Pastga tushuring</span>
            <span className="scroll-dot" aria-hidden="true" />
          </a>
        </section>

        {(data.greetingHeading || paragraphs.length > 0) && (
          <section className="letter reveal" id="atirgul-letter">
            {data.greetingHeading && <h2 className="script-title">{data.greetingHeading}</h2>}
            <RoseDivider />
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
              <RoseCluster className="card-cluster card-cluster--left" />
              <h2 className="card-title">Sevgi kunimiz</h2>
              <div className="calendar" role="img" aria-label={`${grid.label} kalendari`}>
                <div className="calendar-head">{grid.label}</div>
                <div className="calendar-grid week-days">
                  {UZ_WEEKDAYS.map((wd) => <span key={wd}>{wd}</span>)}
                </div>
                {grid.weeks.map((week, wi) => (
                  <div className="calendar-grid days" key={wi}>
                    {week.map((day, di) =>
                      day === grid.day ? (
                        <span className="heart-day" key={di} aria-label="To'y kuni">
                          <HeartShape className="heart-bg" />
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
            <RoseCluster className="card-cluster card-cluster--right" />
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
            <h2 className="script-title script-title--light">To'yga qadar</h2>
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
                    <span className={`timeline-marker${i === markIndex ? " timeline-marker--rose" : ""}`} aria-hidden="true">
                      {i === markIndex && <RoseMark className="timeline-rose" />}
                    </span>
                    <span className="timeline-title">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.features.rsvp && <AtirgulRsvp />}
          {data.features.gift && data.cardNumber && <AtirgulGift />}
          {data.features.wishes && <AtirgulWishes />}
        </div>

        <footer className="footer reveal">
          <RoseGarland className="footer-garland" />
          <p className="footer-note">muhabbat ila,</p>
          <p className="footer-names">{names}</p>
          {parts && <p className="footer-date">{parts.day} · {parts.month} · {parts.year}</p>}
        </footer>
      </main>
    </div>
  );
}

function AtirgulRsvp() {
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

function AtirgulGift() {
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
        <RoseCluster className="bank-card-rose" />
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

function AtirgulWishes() {
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
              <p className="wish-name">{w.name}</p>
              <p className="wish-text">{w.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
