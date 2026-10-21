import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useInvitation } from "../shared/InvitationContext";
import { useCountOpen, useRsvp } from "../shared/useRsvp";
import { useWishes } from "../shared/useWishes";
import { UZ_WEEKDAYS, envelopeLines, monthGrid, useCountdown } from "../shared/calendar";
import { useReveal } from "../shared/useReveal";
import { withBase } from "../../lib/base";
import "./anor.css";

const IMG = withBase("/templates/anor");
const OPENING_DURATION_MS = 1200;
const FADE_DURATION_MS = 900;
const MUSIC_VOLUME = 0.16;

/** Karnaylar yelpig'ichi: markazi 14°, umumiy yoyilish 28° (Django'dagi build_horn_fan). */
const HORNS = [0, 14, 28].map((angle, i) => ({ angle, delay: 0.9 + i * 0.15 }));

type Phase = "closed" | "opening" | "fading" | "open";

/** "Anor" shabloni — konvert ochiladi, karnaylar, anor novdalari, qog'oz kartalar. */
export default function AnorTemplate() {
  const { data, weddingAt, paragraphs, couplePhoto, musicUrl, guestName } = useInvitation();
  const countOpen = useCountOpen();
  const [phase, setPhase] = useState<Phase>("closed");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const grid = useMemo(() => monthGrid(data.date), [data.date]);
  const left = useCountdown(weddingAt);
  const flowerIndex = Math.floor((data.schedule.length + 1) / 2) - 1;

  // Konvert yopiq turganda sahifa aylantirilmaydi
  useEffect(() => {
    if (phase === "open" || phase === "fading") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  // Konvert ochilgach bo'limlar ekranga kirganda paydo bo'ladi.
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

  const names = `${data.groomName || "Kuyov"} va ${data.brideName || "Kelin"}`;

  return (
    <div className="tpl-anor" ref={rootRef}>
      <button
        className={`music-toggle${playing ? " is-playing" : ""}`}
        type="button"
        onClick={toggleMusic}
        aria-pressed={playing}
        aria-label={playing ? "Musiqani to'xtatish" : "Musiqani yoqish"}
        title={playing ? "Musiqani to'xtatish" : "Musiqani yoqish"}
      >
        <span className="music-icon" aria-hidden="true" />
      </button>
      <audio ref={audioRef} src={musicUrl} preload="auto" loop />

      {phase !== "open" && (
        <section
          className={`intro${phase !== "closed" ? " opened" : ""}${phase === "fading" ? " fade-out" : ""}`}
          aria-label="Taklifnoma konverti"
        >
          <div className="envelope-stage" role="img" aria-label="Muhrlangan qog'oz konvert">
            <div className="flap flap-top">
              <p className="flap-note">
                {envelopeLines(data.eventTitle).map((line) => (
                  <span className="flap-note-line" key={line}>{line}</span>
                ))}
                <span className="flap-note-script">taklif etamiz</span>
              </p>
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
            <button
              className="seal-button"
              type="button"
              onClick={openInvitation}
              aria-expanded={phase !== "closed"}
            >
              <span>Ochish</span>
            </button>
          </div>
        </section>
      )}

      <main className="invitation" aria-hidden={phase === "closed" || phase === "opening"}>
        <img className="pomegranate-vine pomegranate-vine--left" src={`${IMG}/pomegranate-vine.svg`} alt="" aria-hidden="true" />
        <img className="pomegranate-vine pomegranate-vine--right" src={`${IMG}/pomegranate-vine.svg`} alt="" aria-hidden="true" />

        <section className="letter-hero reveal">
          <article className="heritage-hero" aria-label="Yoshlar ismlari tushirilgan an'anaviy sahifa">
            <img className="heritage-border" src={`${IMG}/border-ornament.webp`} alt="" aria-hidden="true" />

            {guestName && (
              <p className="guest-greeting">
                Assalomu alaykum, hurmatli
                <strong>{guestName}</strong>
              </p>
            )}

            <div className="heritage-names-row">
              {HORNS.map((h) => (
                <img
                  key={`l${h.angle}`}
                  className="heritage-horn heritage-horn--left"
                  style={{ ["--fan" as string]: `${h.angle}deg`, ["--delay" as string]: `${h.delay}s` }}
                  src={`${IMG}/karnay.png`}
                  alt=""
                  aria-hidden="true"
                />
              ))}
              <h1 className="ornament-names">
                <span className="ornament-name-line">{data.groomName || "Kuyov"}</span>
                <span className="ornament-name-amp">va</span>
                <span className="ornament-name-line">{data.brideName || "Kelin"}</span>
              </h1>
              {HORNS.map((h) => (
                <img
                  key={`r${h.angle}`}
                  className="heritage-horn heritage-horn--right"
                  style={{ ["--fan" as string]: `${h.angle}deg`, ["--delay" as string]: `${h.delay}s` }}
                  src={`${IMG}/karnay.png`}
                  alt=""
                  aria-hidden="true"
                />
              ))}
            </div>

            {couplePhoto ? (
              <img className="heritage-photo" src={couplePhoto} alt={names} />
            ) : (
              <div className="heritage-ornament" aria-hidden="true"><span /></div>
            )}
          </article>

          <a className="scroll-indicator" href="#anor-letter">
            <span>Pastga tushuring</span>
            <span aria-hidden="true">&#8595;</span>
          </a>
        </section>

        {(data.greetingHeading || paragraphs.length > 0) && (
          <section className="letter-card reveal" id="anor-letter">
            {data.greetingHeading && <h2 className="hero-title">{data.greetingHeading}</h2>}
            <div className="lead">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        <div className="details-sections">
          {grid && (
            <section className="paper-card calendar-section reveal" aria-label="To'y sanasi">
              <img className="card-sprig card-sprig--top-left" src={`${IMG}/pomegranate.png`} alt="" aria-hidden="true" />
              <div className="calendar" role="img" aria-label={`${grid.label} kalendari`}>
                <div className="calendar-head"><span>{grid.label}</span></div>
                <div className="calendar-grid week-days">
                  {UZ_WEEKDAYS.map((wd) => <span key={wd}>{wd}</span>)}
                </div>
                {grid.weeks.map((week, wi) => (
                  <div className="calendar-grid days" key={wi}>
                    {week.map((day, di) =>
                      day === grid.day ? (
                        <div className="heart-cell" key={di} aria-label="To'y kuni">
                          <span className="heart-day">{day}</span>
                        </div>
                      ) : (
                        <span key={di}>{day || ""}</span>
                      )
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.schedule.length > 0 && (
            <section className="paper-card schedule-section reveal" aria-label="To'y dasturi">
              <h2 className="card-title">To'y dasturi</h2>
              <div className="schedule-timeline">
                {data.schedule.map((item, i) => (
                  <div className="schedule-item" key={`${item.time}-${i}`}>
                    <span className="schedule-time">{item.time}</span>
                    <span className={`schedule-marker${i === flowerIndex ? " schedule-marker--flower" : ""}`} aria-hidden="true">
                      {i === flowerIndex && <img className="schedule-flower" src={`${IMG}/flower.png`} alt="" />}
                    </span>
                    <span className="schedule-event-name">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="paper-card location-section reveal" aria-label="To'y manzili">
            <img className="card-sprig card-sprig--top-right" src={`${IMG}/pomegranate.png`} alt="" aria-hidden="true" />
            <h2 className="card-title">To'y manzili</h2>
            <p className="venue-name">{data.venueName || "To'yxona nomi"}</p>
            {data.venueAddress && <p className="venue-address">{data.venueAddress}</p>}
            {data.venueLandmark && <p className="venue-address">Mo'ljal: {data.venueLandmark}</p>}
            <p className="venue-address">Soat {data.time}</p>
            {(data.yandexMapUrl || data.googleMapUrl) && (
              <div className="map-links">
                {data.yandexMapUrl && (
                  <a className="map-link" href={data.yandexMapUrl} target="_blank" rel="noopener noreferrer">Yandex xaritasi</a>
                )}
                {data.googleMapUrl && (
                  <a className="map-link" href={data.googleMapUrl} target="_blank" rel="noopener noreferrer">Google Maps</a>
                )}
              </div>
            )}
          </section>

          <section className="paper-card countdown-section reveal" aria-label="Orqaga sanoq">
            <img className="card-sprig card-sprig--bottom-left" src={`${IMG}/flower.png`} alt="" aria-hidden="true" />
            <h2 className="card-title">Har lahzani sanayapmiz</h2>
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
              {left.done ? "Bugun aynan o'sha kun. Sizni kutamiz." : "Sizni intiqlik bilan kutamiz."}
            </p>
          </section>

          {data.features.rsvp && <AnorRsvp />}
          {data.features.gift && data.cardNumber && <AnorGift />}
          {data.features.wishes && <AnorWishes />}
        </div>

        <p className="anor-footer">{names}</p>
      </main>
    </div>
  );
}

function AnorRsvp() {
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
    <section className="paper-card rsvp-section reveal" aria-label="Javobingiz">
      <h2 className="card-title">Kelasizmi?</h2>
      {sent ? (
        <>
          <p className="anor-thanks">Rahmat!</p>
          <p className="venue-address">
            {sent.attending ? "Sizni intiqlik bilan kutamiz." : "Afsus! Duolaringiz biz bilan bo'lsin."}
          </p>
          <button type="button" className="anor-link" onClick={reset}>Javobni o'zgartirish</button>
        </>
      ) : (
        <>
          <p className="card-subtitle">Tayyorgarlik ko'rishimiz uchun javobingizni bildiring</p>
          <form className="anor-form" onSubmit={onSubmit}>
            <input
              className="anor-input"
              placeholder="Ismingiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
            <div className="anor-choice">
              <button type="button" className={attending === true ? "is-active" : ""} onClick={() => setAttending(true)} aria-pressed={attending === true}>
                Albatta kelaman
              </button>
              <button type="button" className={attending === false ? "is-active" : ""} onClick={() => setAttending(false)} aria-pressed={attending === false}>
                Kela olmayman
              </button>
            </div>
            {attending && (
              <label className="anor-row">
                Necha kishi bo'lasiz?
                <select className="anor-input" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
            {error && <p className="anor-error">{error}</p>}
            <button className="anor-button" type="submit" disabled={submitting || attending === null || !name.trim()}>
              {submitting ? "Yuborilmoqda..." : "Javob yuborish"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

function AnorGift() {
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
    <section className="paper-card gift-section reveal" aria-label="To'yona">
      <h2 className="card-title">To'yona</h2>
      <p className="card-subtitle">E'tiboringiz uchun minnatdormiz</p>
      <p className="gift-number">{formatted}</p>
      {data.cardHolder && <p className="gift-holder">{data.cardHolder}</p>}
      <button type="button" className="map-link" onClick={copy}>
        {copied ? "Nusxalandi ✓" : "Raqamni nusxalash"}
      </button>
    </section>
  );
}

function AnorWishes() {
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
    <section className="paper-card wishes-section reveal" aria-label="Tilaklar">
      <h2 className="card-title">Tilak va tabriklar</h2>
      <p className="card-subtitle">Yangi oilaga eng samimiy tilaklaringizni qoldiring</p>
      <form className="anor-form" onSubmit={(e) => void onSubmit(e)}>
        <input className="anor-input" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <textarea className="anor-input" placeholder="Tilagingiz..." value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} />
        {error && <p className="anor-error">{error}</p>}
        <button className="anor-button" type="submit" disabled={submitting}>
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
