import { FormEvent, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInvitation } from "../shared/InvitationContext";
import { useCountOpen, useRsvp } from "../shared/useRsvp";
import { useWishes } from "../shared/useWishes";
import { UZ_MONTHS, useCountdown } from "../shared/calendar";
import { useReveal } from "../shared/useReveal";
import { useSlotFocus } from "../shared/useSlotFocus";
import { mediaUrl } from "../../lib/api";
import { Cloud, DoodleHeart, EnvelopeDoodle, GoldSeal, HeartPin, HeartShape } from "./ornaments";
import { resolveOsmonPhotos } from "./photos";
import "./osmon.css";

const OPENING_DURATION_MS = 1900;
const FADE_DURATION_MS = 900;
const MUSIC_VOLUME = 0.2;
/** Karta yuzasining shuncha qismi artilganda sana to'liq ochiladi. */
const SCRATCH_REVEAL_RATIO = 0.45;

const UZ_WEEKDAY_NAMES = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

/** Hero ustida sekin ko'tariluvchi kichik yuraklar. */
const FLOAT_HEARTS = [
  { left: 12, size: 12, dur: 9, delay: 0 },
  { left: 78, size: 16, dur: 11, delay: 2.5 },
  { left: 30, size: 10, dur: 10, delay: 5 },
  { left: 62, size: 13, dur: 12, delay: 7 },
  { left: 88, size: 10, dur: 9.5, delay: 4 },
];

type Phase = "closed" | "opening" | "fading" | "open";

function dateParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  const weekday = UZ_WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { label: `${d}-${UZ_MONTHS[m - 1]}, ${y}`, weekday };
}

/** "Osmon" shabloni — chang-ko'k va krem ranglar, oltin muhrli qog'oz konvert, artib ochiladigan sana. */
export default function OsmonTemplate() {
  const { data, weddingAt, paragraphs, couplePhoto, musicUrl, guestName } = useInvitation();
  const countOpen = useCountOpen();
  const [phase, setPhase] = useState<Phase>("closed");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const parts = useMemo(() => dateParts(data.date), [data.date]);
  const photos = useMemo(
    () =>
      resolveOsmonPhotos(
        mediaUrl(data.coverPhoto ?? ""),
        couplePhoto,
        mediaUrl(data.venuePhoto ?? ""),
        (data.gallery ?? []).map(mediaUrl)
      ),
    [data.coverPhoto, data.venuePhoto, data.gallery, couplePhoto]
  );

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
  const coupleNames = (
    <>
      {groom}
      <span className="amp">&amp;</span>
      <br />
      {bride}
    </>
  );

  return (
    <div className="tpl-osmon" ref={rootRef}>
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
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" /></svg>
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
          <div className="env">
            <div className="env-lining" aria-hidden="true" />
            <div className="env-card" aria-hidden="true">
              <span className="env-card-names">{coupleNames}</span>
              {parts && <span className="env-card-date">{parts.label}</span>}
            </div>
            <div className="env-flap env-flap--left" aria-hidden="true" />
            <div className="env-flap env-flap--right" aria-hidden="true" />
            <div className="env-flap env-flap--bottom" aria-hidden="true" />
            <div className="env-top" aria-hidden="true">
              <div className="env-top-face env-top-face--front" />
              <div className="env-top-face env-top-face--back" />
            </div>
          </div>

          <button className="seal-button" type="button" onClick={openInvitation} aria-expanded={phase !== "closed"}>
            <GoldSeal className="seal-svg" />
            <span className="sr-only">Taklifnomani ochish</span>
          </button>
          <p className="intro-hint" aria-hidden="true">
            <span className="intro-dot" />
            Ochish uchun bosing
          </p>
        </section>
      )}

      <main className="invitation" aria-hidden={phase === "closed" || phase === "opening"}>
        <section className={`hero${photos.hero ? " hero--photo" : ""}`} data-slot={photos.card ? "cover" : "cover couple"}>
          {photos.hero && <img className="hero-photo" src={photos.hero} alt={names} />}
          <div className="hero-veil" aria-hidden="true" />
          <DoodleHeart className="hero-doodle" />
          <Cloud className="hero-cloud" />
          <Cloud className="hero-cloud hero-cloud--small" />
          <div className="hero-hearts" aria-hidden="true">
            {FLOAT_HEARTS.map((h, i) => (
              <DoodleHeart
                key={i}
                className="hero-heart"
                style={{ left: `${h.left}%`, width: h.size, animationDuration: `${h.dur}s`, animationDelay: `${h.delay}s` }}
              />
            ))}
          </div>

          <div className="hero-content">
            {guestName && (
              <p className="guest-greeting">
                Assalomu alaykum, hurmatli
                <strong>{guestName}</strong>
              </p>
            )}
            <p className="hero-eyebrow">{data.eventTitle || "To'y kuni"}</p>
            <h1 className="hero-names">{coupleNames}</h1>
            <p className="hero-sub">Turmush qurishmoqda!</p>
            {parts && (
              <p className="hero-date">
                {parts.label} · {data.time}
              </p>
            )}
          </div>

          <a className="scroll-cue" href="#osmon-greeting">
            <span>Pastga suring</span>
            <span className="scroll-line" aria-hidden="true">
              <small>scroll</small>
            </span>
          </a>
        </section>

        {(photos.card || data.greetingHeading || paragraphs.length > 0) && (
          <section className="greeting" id="osmon-greeting">
            {photos.card && (
              <figure className="photo-card couple-card reveal" data-slot="couple">
                <img src={photos.card} alt={names} loading="lazy" />
                <DoodleHeart className="photo-card-heart" />
              </figure>
            )}
            <div className="greeting-text">
              <EnvelopeDoodle tone="gold" className="greeting-env greeting-env--gold" />
              <EnvelopeDoodle tone="blue" className="greeting-env greeting-env--blue" />
              {data.greetingHeading && <h2 className="script-title reveal">{data.greetingHeading}</h2>}
              <div className="lead reveal">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {data.features.gift && data.cardNumber && <OsmonGift />}

        <section className="band invited" aria-label="To'y sanasi">
          <h2 className="script-title reveal">Siz taklif qilingansiz!</h2>
          {parts && <ScratchDate label={parts.label} weekday={parts.weekday} time={data.time} />}
          <OsmonCountdown iso={weddingAt} />
        </section>

        {data.schedule.length > 0 && (
          <section className="schedule" aria-label="To'y dasturi">
            <h2 className="script-title reveal">To'y dasturi</h2>
            <ol className="timeline reveal">
              {data.schedule.map((item, i) => (
                <li key={`${item.time}-${i}`}>
                  <span className="timeline-time">{item.time}</span>
                  <HeartShape className="timeline-heart" />
                  <span className="timeline-title">{item.title}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="venue" aria-label="To'y manzili">
          {photos.venue && (
            <figure className="photo-card venue-photo reveal" data-slot="venue">
              <img src={photos.venue} alt={data.venueName || "To'yxona"} loading="lazy" />
            </figure>
          )}
          <HeartPin className="venue-pin reveal" />
          <h2 className="script-title reveal">To'y maskani</h2>
          <div className="reveal">
            <p className="venue-name">{data.venueName || "To'yxona nomi"}</p>
            {data.venueAddress && (
              <p className="venue-line">
                <b>Manzil:</b> {data.venueAddress}
              </p>
            )}
            {data.venueLandmark && (
              <p className="venue-line">
                <b>Mo'ljal:</b> {data.venueLandmark}
              </p>
            )}
            {data.dressCode && (
              <p className="venue-line">
                <b>Dress-kod:</b> {data.dressCode}
              </p>
            )}
            {(data.googleMapUrl || data.yandexMapUrl) && (
              <div className="button-row">
                {data.googleMapUrl && (
                  <a className="outline-button" href={data.googleMapUrl} target="_blank" rel="noopener noreferrer">
                    {data.yandexMapUrl ? "Google xarita" : "Xaritada ko'rish"}
                  </a>
                )}
                {data.yandexMapUrl && (
                  <a className="outline-button" href={data.yandexMapUrl} target="_blank" rel="noopener noreferrer">
                    {data.googleMapUrl ? "Yandex xarita" : "Xaritada ko'rish"}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {photos.gallery.length > 0 && <OsmonGallery photos={photos.gallery} />}
        {data.features.rsvp && <OsmonRsvp />}
        {data.features.wishes && <OsmonWishes />}

        <footer className="footer">
          <DoodleHeart className="footer-heart reveal" />
          <p className="footer-names reveal">{coupleNames}</p>
          <p className="footer-note reveal">Sizni ko'rishni umid qilamiz!</p>
          {parts && <p className="footer-date reveal">{parts.label}</p>}
        </footer>
      </main>
    </div>
  );
}

/**
 * Lotereya chiptasidek artiladigan karta: ko'k qatlam barmoq yoki sichqoncha
 * bilan o'chiriladi, ma'lum qismi artilgach sana to'liq ochiladi.
 */
function ScratchDate({ label, weekday, time }: { label: string; weekday: string; time: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = wrap.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#7d9fb1");
    gradient.addColorStop(0.5, "#64a0bd");
    gradient.addColorStop(1, "#52839c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    // Yaltiroq zarrachalar
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.22})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.6 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.min(18, width / 18)}px Rufina, Georgia, serif`;
    ctx.fillText("✦  Sanani ochish uchun suring  ✦", width / 2, height / 2);
  }, []);

  useEffect(() => {
    if (revealed) return;
    paint();
    // Shrift yuklangach matnni qayta chizamiz; o'lcham o'zgarsa ham qayta bo'yaladi
    void document.fonts?.ready.then(() => {
      if (strokes.current === 0) paint();
    });
    const wrap = wrapRef.current;
    if (!wrap || !("ResizeObserver" in window)) return;
    let lastWidth = wrap.getBoundingClientRect().width;
    const observer = new ResizeObserver(([entry]) => {
      if (Math.abs(entry.contentRect.width - lastWidth) < 1) return;
      lastWidth = entry.contentRect.width;
      strokes.current = 0;
      paint();
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [paint, revealed]);

  const clearedRatio = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return 0;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    // Har 24-pikselni tekshirish yetarli va tez
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i] === 0) clear++;
    }
    return total ? clear / total : 0;
  };

  const scratch = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const from = lastPoint.current ?? point;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 38;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x + 0.01, point.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    lastPoint.current = point;
    strokes.current++;
    if (strokes.current % 8 === 0 && clearedRatio() >= SCRATCH_REVEAL_RATIO) setRevealed(true);
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPoint.current = null;
    scratch(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    scratch(e);
  };

  const onPointerUp = () => {
    lastPoint.current = null;
    if (clearedRatio() >= SCRATCH_REVEAL_RATIO) setRevealed(true);
  };

  return (
    <div className="scratch reveal">
      <div className={`scratch-card${revealed ? " is-revealed" : ""}`} ref={wrapRef}>
        <div className="scratch-date" aria-live="polite">
          <span className="scratch-weekday">{weekday}</span>
          <span className="scratch-label">{label}</span>
          <span className="scratch-time">{time}</span>
        </div>
        {revealed && (
          <div className="scratch-burst" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <HeartShape key={i} className="burst-heart" style={{ ["--a" as string]: `${i * 45}deg` }} />
            ))}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="scratch-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden="true"
        />
      </div>
      <button type="button" className="scratch-hint" onClick={() => setRevealed(true)} disabled={revealed}>
        {revealed ? "✦ Sizni kutamiz ✦" : "✦ Sanani ochish uchun suring ✦"}
      </button>
    </div>
  );
}

/** Rasmlar to'ri; bosilgan rasm butun ekranda ochiladi (strelkalar va Esc bilan). */
function OsmonGallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <section className="band gallery" aria-label="Fotogalereya">
      <h2 className="script-title reveal">Fotogalereya</h2>
      <div className={`gallery-grid${photos.length % 2 ? " gallery-grid--odd" : ""}`} data-slot="gallery">
        {photos.map((src, i) => (
          <button key={`${src}-${i}`} type="button" className="gallery-item reveal" onClick={() => setOpen(i)}>
            <img src={src} alt={`${i + 1}-rasm`} loading="lazy" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Rasm" onClick={() => setOpen(null)}>
          <img src={photos[open]} alt={`${open + 1}-rasm`} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="lightbox-close" aria-label="Yopish" onClick={() => setOpen(null)}>×</button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav--prev"
                aria-label="Oldingi rasm"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-nav--next"
                aria-label="Keyingi rasm"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function OsmonCountdown({ iso }: { iso: string }) {
  const left = useCountdown(iso);
  return (
    <div className="countdown reveal" role="timer">
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
  );
}

function OsmonGift() {
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
    <section className="gift" aria-label="To'yona">
      <p className="reveal">
        Agar istasangiz, to'yonani karta orqali yuborishingiz mumkin.
        {data.cardHolder && (
          <>
            <br />
            Qabul qiluvchi: {data.cardHolder}
          </>
        )}
      </p>
      <p className="gift-label reveal">Karta raqami:</p>
      <p className="gift-number reveal">{formatted}</p>
      <button type="button" className="outline-button reveal" onClick={copy}>
        {copied ? "Nusxalandi ✓" : "Kartani nusxalash"}
      </button>
    </section>
  );
}

function OsmonRsvp() {
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
    <section className="band rsvp" aria-label="Javobingiz">
      <GoldSeal className="rsvp-seal reveal" />
      <h2 className="script-title reveal">Qatnashishingizni tasdiqlang</h2>
      {sent ? (
        <div className="reveal visible">
          <p className="thanks">Rahmat!</p>
          <p className="muted">
            {sent.attending ? "Sizni intiqlik bilan kutamiz." : "Afsus! Duolaringiz biz bilan bo'lsin."}
          </p>
          <button type="button" className="text-link" onClick={reset}>Javobni o'zgartirish</button>
        </div>
      ) : (
        <>
          <p className="muted reveal">Quvonchli tantanaga tayyorgarlik ko'rishimiz uchun qatnashishingizni tasdiqlang.</p>
          <form className="form reveal" onSubmit={onSubmit}>
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
            <button className="solid-button" type="submit" disabled={submitting || attending === null || !name.trim()}>
              {submitting ? "Yuborilmoqda..." : "Javob yuborish"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

function OsmonWishes() {
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
    <section className="wishes" aria-label="Tilaklar">
      <h2 className="script-title reveal">Tilak va tabriklar</h2>
      <p className="muted reveal">Yangi oilaga eng samimiy tilaklaringizni qoldiring</p>
      <form className="form reveal" onSubmit={(e) => void onSubmit(e)}>
        <input className="input" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <textarea className="input" placeholder="Tilagingiz..." value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} />
        {error && <p className="form-error">{error}</p>}
        <button className="solid-button" type="submit" disabled={submitting}>
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
