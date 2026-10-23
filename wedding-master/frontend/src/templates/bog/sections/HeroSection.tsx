import { motion, useScroll, useTransform } from "framer-motion";
import { useInvitation } from "../../shared/InvitationContext";
import { useLang } from "../../../context/LanguageContext";
import { withBase } from "../../../lib/base";

/* ── Water-drop reveal positions ───────────────────────────────────── */
const DROPS = [
  { x: 28, y: 20, delay: 0 },
  { x: 72, y: 35, delay: 1 },
  { x: 48, y: 65, delay: 2.0 },
  { x: 16, y: 52, delay: 2.45 },
];

/* ── Dove flock data ────────────────────────────────────────────────── */
const DOVES = [
  {
    top: 8,
    dur: 18,
    delay: 0,
    rDelay: 4,
    size: 58,
    drift: 12,
    rtl: false,
    op: 0.9,
    rot: 15,
  },
  {
    top: 20,
    dur: 23,
    delay: 2.5,
    rDelay: 6,
    size: 44,
    drift: 18,
    rtl: true,
    op: 0.8,
    rot: 20,
  },
  {
    top: 13,
    dur: 15,
    delay: 5.5,
    rDelay: 3,
    size: 68,
    drift: 8,
    rtl: false,
    op: 0.95,
    rot: 0,
  },
  {
    top: 35,
    dur: 26,
    delay: 1,
    rDelay: 8,
    size: 50,
    drift: 16,
    rtl: true,
    op: 0.75,
    rot: 40,
  },
  {
    top: 5,
    dur: 20,
    delay: 8,
    rDelay: 5,
    size: 38,
    drift: 22,
    rtl: false,
    op: 0.7,
    rot: 45,
  },
  {
    top: 28,
    dur: 17,
    delay: 3.5,
    rDelay: 7,
    size: 62,
    drift: 10,
    rtl: false,
    op: 0.85,
    rot: 25,
  },
  {
    top: 16,
    dur: 24,
    delay: 10,
    rDelay: 4,
    size: 46,
    drift: 15,
    rtl: true,
    op: 0.76,
    rot: 35,
  },
  {
    top: 42,
    dur: 19,
    delay: 6,
    rDelay: 9,
    size: 40,
    drift: 20,
    rtl: false,
    op: 0.72,
    rot: 10,
  },
  {
    top: 22,
    dur: 21,
    delay: 4,
    rDelay: 5,
    size: 54,
    drift: 12,
    rtl: true,
    op: 0.82,
    rot: 42,
  },
  {
    top: 10,
    dur: 16,
    delay: 12,
    rDelay: 3,
    size: 52,
    drift: 14,
    rtl: false,
    op: 0.88,
    rot: 18,
  },
  {
    top: 32,
    dur: 22,
    delay: 7,
    rDelay: 6,
    size: 60,
    drift: 9,
    rtl: true,
    op: 0.78,
    rot: 30,
  },
  {
    top: 48,
    dur: 28,
    delay: 0.5,
    rDelay: 10,
    size: 36,
    drift: 24,
    rtl: false,
    op: 0.65,
    rot: 12,
  },
];

/* ── Single dove GIF ──────────────────────────────────────────────── */
function DoveSVG({
  size,
  rtl,
  op,
  rot,
}: {
  size: number;
  rtl: boolean;
  op: number;
  rot: number;
}) {
  const scaleX = rtl ? -1 : 1;
  return (
    <img
      src={withBase("/assets/dove.gif")}
      alt=""
      aria-hidden="true"
      width={size}
      style={{
        transform: `scaleX(${scaleX}) rotate(${rot}deg)`,
        opacity: op,
        mixBlendMode: "multiply",
      }}
    />
  );
}

/* ── Dove flock layer ─────────────────────────────────────────────── */
function DoveFlock() {
  return (
    <div className="absolute inset-0 z-[10] pointer-events-none overflow-hidden">
      {DOVES.map((d, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: 0, top: `${d.top}%` }}
          initial={{ x: d.rtl ? "calc(100vw + 80px)" : "-80px" }}
          animate={{
            x: d.rtl
              ? ["calc(100vw + 80px)", "-80px"]
              : ["-80px", "calc(100vw + 80px)"],
          }}
          transition={{
            duration: d.dur,
            delay: d.delay,
            repeat: Infinity,
            repeatDelay: d.rDelay,
            ease: "linear",
          }}
        >
          <motion.div
            animate={{ y: [0, -d.drift, 0, d.drift, 0] }}
            transition={{
              duration: d.dur * 0.65,
              ease: "easeInOut",
              repeat: Infinity,
              delay: d.delay,
            }}
          >
            <DoveSVG size={d.size} rtl={d.rtl} op={d.op} rot={d.rot} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── HeroSection ──────────────────────────────────────────────────── */
export function HeroSection() {
  const { t } = useLang();
  const { data: wedding, guestName: invitedGuest } = useInvitation();
  const guestName = invitedGuest || "aziz qadrdonim";
  const { scrollY } = useScroll();
  const archY      = useTransform(scrollY, [0, 700], [0, -110]);
  const ornamentY  = useTransform(scrollY, [0, 700], [0, -45]);
  const coupleY    = useTransform(scrollY, [0, 700], [0, -40]);

  return (
    <section className="min-h-[100dvh] bg-cream relative overflow-hidden flex flex-col justify-end">
      {/* ── 1. Arch — water-drop reveal + parallax ── */}
      <motion.div
        className="absolute inset-0 z-[2] pointer-events-none select-none"
        style={{ y: archY }}
      >
        <div className="w-full h-full opacity-40 relative">
          {/* SVG clipPath: 4 ta doira kengayib bitta arch ni ochadi */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id="drops-clip" clipPathUnits="userSpaceOnUse">
                {DROPS.map((drop, i) => (
                  <motion.circle
                    key={i}
                    cx={`${drop.x}%`}
                    cy={`${drop.y}%`}
                    initial={{ r: 0 }}
                    animate={{ r: 2000 }}
                    transition={{
                      duration: 2.4,
                      ease: [0.2, 0.8, 0.4, 1],
                      delay: drop.delay,
                    }}
                  />
                ))}
              </clipPath>
            </defs>
          </svg>

          {/* Bitta arch — to'rt tomchi orqali ochiladi */}
          <div
            className="w-full h-full"
            style={{
              clipPath: "url(#drops-clip)",
              WebkitClipPath: "url(#drops-clip)",
            }}
          >
            <ArchImage />
          </div>
        </div>
      </motion.div>

      {/* ── 2. Doves ── */}
      <DoveFlock />

      {/* ── 3. Couple + Names ── */}
      <motion.div
        className="absolute left-10 right-0 bottom-0 z-[20] flex justify-center items-end pointer-events-none select-none"
        style={{ y: coupleY }}
      >
        <div className="relative w-fit">
          <h1 className="sr-only">
            {t(wedding.groomName)} & {t(wedding.brideName)}
          </h1>

          <motion.img
            src={withBase("/assets/couple.webp")}
            alt=""
            aria-hidden="true"
            className="w-auto h-[67dvh] sm:h-[70dvh] xl:h-[74dvh] block object-cover z-[100]"
            loading="eager"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />

          {/* Kuyov ismi */}
          <motion.span
            aria-hidden="true"
            className="absolute
                       top-4 sm:top-[8%] md:top-[11%] lg:top-[13%]
                       -left-[22%] sm:left-auto sm:right-[105%]
                       font-script text-4xl sm:text-6xl md:text-8xl lg:text-9xl
                       text-forest leading-none whitespace-nowrap
                       [text-shadow:0_0_24px_rgba(255,255,255,1),0_0_12px_rgba(255,255,255,1),0_2px_6px_rgba(255,255,255,0.9)]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          >
            {t(wedding.groomName)}
          </motion.span>

          {/* Kelin ismi */}
          <motion.span
            aria-hidden="true"
            className="absolute
                       top-[33%] sm:top-[35%] md:top-[28%]
                       left-[64%] sm:left-[60%] md:left-[64%] lg:left-[70%]
                       font-script text-4xl sm:text-6xl md:text-8xl lg:text-9xl
                       text-forest leading-none whitespace-nowrap
                       [text-shadow:0_0_24px_rgba(255,255,255,1),0_0_12px_rgba(255,255,255,1),0_2px_6px_rgba(255,255,255,0.9)] -z-10"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
          >
            {t(wedding.brideName)}
          </motion.span>
        </div>
      </motion.div>

      {/* ── 4. Edge fades ── */}
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-cream via-cream/55 to-transparent pointer-events-none z-[15]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cream/80 to-transparent pointer-events-none z-[15]" />

      {/* ── 5. Corner ornaments — parallax ── */}
      <motion.div
        className="absolute top-5 left-5 opacity-20 pointer-events-none z-[5]"
        style={{ y: ornamentY }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
      >
        <CornerMotif />
      </motion.div>
      <motion.div
        className="absolute top-5 right-5 opacity-20 pointer-events-none z-[5] scale-x-[-1]"
        style={{ y: ornamentY }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 1.1 }}
      >
        <CornerMotif />
      </motion.div>

      {/* ── Shaxsiy ism — yuqori markaz ── */}
      {guestName && (
        <motion.div
          className="absolute top-8 inset-x-0 z-[40] flex justify-center px-5"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.8 }}
        >
          <p className="font-script text-xl sm:text-2xl text-forest leading-snug text-center
                        bg-white/70 backdrop-blur-sm px-5 py-2 rounded-2xl border border-forest/10">
            {t('Assalomu alaykum, hurmatli')}<br />{t(guestName)},
          </p>
        </motion.div>
      )}

      {/* ── 6. Content ── */}
      <div className="relative z-[40] flex flex-col items-center gap-4 px-5 pb-10 pt-2">
        {/* Separator */}
        <motion.div
          className="flex items-center gap-3 justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.9 }}
        >
          <span className="h-px w-10 bg-forest/20" />
          <span className="text-forest/30 text-xs">✦</span>
          <span className="h-px w-10 bg-forest/20" />
        </motion.div>

        {/* Taklif matni */}
        <motion.p
          className="font-formal italic text-md sm:text-2xl text-forest/90 tracking-wide leading-snug
                      bg-white backdrop-blur-sm px-5 py-2 rounded-full border border-forest/12 inline-block text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 1.05 }}
        >
          {t(wedding.inviteText)}
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          className="flex flex-col items-center gap-2 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          <p className="font-body text-[9px] tracking-[0.3em] uppercase text-forest/40">
            {t('Batafsil')}
          </p>
          <button
            aria-label={t('Pastga scroll qiling')}
            onClick={() =>
              document
                .getElementById("event")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <span className="w-6 h-9 rounded-full border border-forest/35 flex items-start justify-center pt-1.5 group-hover:border-forest/60 transition-colors">
              <span className="w-1 h-1.5 rounded-full bg-forest/50 animate-scroll-dot group-hover:bg-forest/70" />
            </span>
            <span className="flex flex-col items-center -space-y-1 animate-bounce">
              <ChevronDown className="w-3.5 h-3.5 text-forest/35" />
              <ChevronDown className="w-3.5 h-3.5 text-forest/20" />
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ── QuoteCard ────────────────────────────────────────────────────── */
export function QuoteCard({ text, ref_ }: { text: string; ref_: string }) {
  return (
    <div className="relative bg-cream/60 backdrop-blur-sm rounded-xl px-5 py-4 border border-forest/10 overflow-hidden h-full">
      <span
        className="absolute top-1 left-3 font-script text-5xl text-forest/12 leading-none select-none"
        aria-hidden="true"
      >
        "
      </span>
      <p className="font-formal italic text-base sm:text-xl text-charcoal/90 leading-relaxed pt-3 px-1">
        {text}
      </p>
      <div className="flex items-center gap-2 mt-2.5">
        <span className="h-px flex-1 bg-forest/15" />
        <p className="font-body text-[11px] tracking-[0.22em] uppercase text-forest/60 shrink-0">
          {ref_}
        </p>
      </div>
    </div>
  );
}

/* ── ChevronDown ──────────────────────────────────────────────────── */
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ── ArchImage ────────────────────────────────────────────────────── */
function ArchImage() {
  return (
    <>
      <img
        src={withBase("/assets/arc.webp")}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const sibling = e.currentTarget
            .nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = "block";
        }}
      />
      <div style={{ display: "none" }} aria-hidden="true">
        <FloralArchSVG />
      </div>
    </>
  );
}

function FloralArchSVG() {
  return (
    <svg
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <rect
        x="60"
        y="290"
        width="14"
        height="195"
        rx="7"
        fill="#8b6b47"
        opacity="0.3"
      />
      <rect
        x="326"
        y="290"
        width="14"
        height="195"
        rx="7"
        fill="#8b6b47"
        opacity="0.3"
      />
      <path
        d="M74 290 Q74 70 200 50 Q326 70 326 290"
        stroke="#30401c"
        strokeWidth="3.5"
        fill="none"
        opacity="0.45"
        strokeLinecap="round"
      />
      <circle cx="68" cy="160" r="20" fill="#e8c4c0" opacity="0.88" />
      <circle cx="68" cy="160" r="7" fill="#c98f88" opacity="0.65" />
      <circle cx="50" cy="178" r="15" fill="#f0d5d0" opacity="0.78" />
      <circle cx="82" cy="182" r="17" fill="#d4a8a2" opacity="0.82" />
      <circle cx="55" cy="202" r="14" fill="#e8c4c0" opacity="0.72" />
      <circle cx="42" cy="218" r="11" fill="#f0d5d0" opacity="0.65" />
      <circle cx="76" cy="212" r="12" fill="#dbbab5" opacity="0.7" />
      <path
        d="M46 140 Q38 122 50 112 Q58 130 46 140Z"
        fill="#30401c"
        opacity="0.52"
      />
      <path
        d="M72 135 Q65 117 78 108 Q85 125 72 135Z"
        fill="#30401c"
        opacity="0.47"
      />
      <path
        d="M35 192 Q24 178 28 163 Q42 173 35 192Z"
        fill="#30401c"
        opacity="0.47"
      />
      <path
        d="M54 225 Q40 216 42 200 Q56 207 54 225Z"
        fill="#30401c"
        opacity="0.42"
      />
      <circle cx="33" cy="235" r="7" fill="#f0d5d0" opacity="0.58" />
      <circle cx="86" cy="232" r="6" fill="#e8c4c0" opacity="0.58" />
      <circle cx="332" cy="160" r="20" fill="#e8c4c0" opacity="0.88" />
      <circle cx="332" cy="160" r="7" fill="#c98f88" opacity="0.65" />
      <circle cx="350" cy="178" r="15" fill="#f0d5d0" opacity="0.78" />
      <circle cx="318" cy="182" r="17" fill="#d4a8a2" opacity="0.82" />
      <circle cx="345" cy="202" r="14" fill="#e8c4c0" opacity="0.72" />
      <circle cx="358" cy="218" r="11" fill="#f0d5d0" opacity="0.65" />
      <circle cx="324" cy="212" r="12" fill="#dbbab5" opacity="0.7" />
      <path
        d="M354 140 Q362 122 350 112 Q342 130 354 140Z"
        fill="#30401c"
        opacity="0.52"
      />
      <path
        d="M328 135 Q335 117 322 108 Q315 125 328 135Z"
        fill="#30401c"
        opacity="0.47"
      />
      <path
        d="M365 192 Q376 178 372 163 Q358 173 365 192Z"
        fill="#30401c"
        opacity="0.47"
      />
      <path
        d="M346 225 Q360 216 358 200 Q344 207 346 225Z"
        fill="#30401c"
        opacity="0.42"
      />
      <circle cx="367" cy="235" r="7" fill="#f0d5d0" opacity="0.58" />
      <circle cx="314" cy="232" r="6" fill="#e8c4c0" opacity="0.58" />
      <circle cx="200" cy="52" r="22" fill="#e8c4c0" opacity="0.92" />
      <circle cx="200" cy="52" r="8" fill="#c98f88" opacity="0.68" />
      <circle cx="178" cy="64" r="16" fill="#f0d5d0" opacity="0.78" />
      <circle cx="222" cy="64" r="16" fill="#d4a8a2" opacity="0.78" />
      <circle cx="160" cy="80" r="13" fill="#e8c4c0" opacity="0.72" />
      <circle cx="240" cy="80" r="13" fill="#f0d5d0" opacity="0.72" />
      <path
        d="M200 28 Q194 14 200 6 Q206 14 200 28Z"
        fill="#30401c"
        opacity="0.58"
      />
      <path
        d="M180 40 Q166 30 170 18 Q184 26 180 40Z"
        fill="#30401c"
        opacity="0.52"
      />
      <path
        d="M220 40 Q234 30 230 18 Q216 26 220 40Z"
        fill="#30401c"
        opacity="0.52"
      />
      <path
        d="M150 84 Q136 74 142 60 Q156 68 150 84Z"
        fill="#30401c"
        opacity="0.47"
      />
      <path
        d="M250 84 Q264 74 258 60 Q244 68 250 84Z"
        fill="#30401c"
        opacity="0.47"
      />
      <path
        d="M74 290 Q60 312 66 336 Q80 318 74 290Z"
        fill="#30401c"
        opacity="0.28"
      />
      <path
        d="M326 290 Q340 312 334 336 Q320 318 326 290Z"
        fill="#30401c"
        opacity="0.28"
      />
      <path
        d="M110 275 Q96 295 102 315 Q116 300 110 275Z"
        fill="#30401c"
        opacity="0.22"
      />
      <path
        d="M290 275 Q304 295 298 315 Q284 300 290 275Z"
        fill="#30401c"
        opacity="0.22"
      />
      <ellipse
        cx="200"
        cy="488"
        rx="130"
        ry="8"
        fill="#30401c"
        opacity="0.07"
      />
    </svg>
  );
}

/* ── CornerMotif ──────────────────────────────────────────────────── */
function CornerMotif() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 4 Q36 4 68 4 Q68 36 68 68"
        stroke="#30401c"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M4 4 Q22 22 36 36"
        stroke="#30401c"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="36" cy="4" r="3.5" fill="#30401c" opacity="0.55" />
      <circle cx="68" cy="36" r="3.5" fill="#30401c" opacity="0.55" />
      <circle cx="4" cy="4" r="2.5" fill="#30401c" />
      <path d="M12 4 Q16 10 12 16 Q8 10 12 4Z" fill="#30401c" opacity="0.35" />
      <path
        d="M68 12 Q62 16 56 12 Q62 8 68 12Z"
        fill="#30401c"
        opacity="0.35"
      />
    </svg>
  );
}
