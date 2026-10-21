import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useLang } from "../../context/LanguageContext";
import { toCyrillic, toLatin } from "../../lib/transliterate";

interface WishCardProps {
  name: string;
  message: string;
  createdAt: string;
  /** Karusel uchun: xabarni bir nechta qatorga cheklaydi (bir xil balandlik). */
  clamp?: boolean;
}

export function WishCard({ name, message, createdAt, clamp = false }: WishCardProps) {
  const { lang, t } = useLang();
  // Tilak qaysi yozuvda kiritilganidan qat'i nazar, joriy tilga o'giramiz:
  // kiril rejimida -> kirilga, lotin rejimida -> lotinga.
  const render = lang === "kirill" ? toCyrillic : toLatin;
  const date = t(dayjs(createdAt).locale("uz-latn").format("D MMMM YYYY"));

  return (
    <motion.article
      className="relative bg-white rounded-2xl px-7 py-7 shadow-md border border-forest/8 overflow-hidden"
      whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(48,64,28,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Top-right floral corner */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-25">
        <FloralCornerTR />
      </div>

      {/* Bottom-left leaf corner */}
      <div className="absolute bottom-0 left-0 pointer-events-none opacity-20">
        <LeafCornerBL />
      </div>

      {/* Subtle top accent line */}
      <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-forest/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        <p className="font-script text-3xl text-forest leading-tight mb-3">
          {render(name)}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="h-px bg-forest/15 flex-1" />
          <span className="text-forest/30 text-xs">✦</span>
          <span className="h-px bg-forest/15 flex-1" />
        </div>

        <p
          className={`font-body text-sm text-charcoal/80 leading-relaxed mb-4 break-words ${
            clamp ? "line-clamp-4" : "whitespace-pre-wrap"
          }`}
        >
          {render(message)}
        </p>

        <p className="font-body text-[10px] text-charcoal/35 tracking-widest uppercase text-right">
          {date}
        </p>
      </div>
    </motion.article>
  );
}

/* ── Floral corner SVGs ──────────────────────────────────────────────── */

function FloralCornerTR() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M96 0 Q72 24 56 48"
        stroke="#30401c"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M96 0 Q84 36 72 56"
        stroke="#30401c"
        strokeWidth="1"
        fill="none"
        opacity="0.45"
      />
      <circle cx="86" cy="14" r="11" fill="#e8c4c0" opacity="0.9" />
      <circle cx="86" cy="14" r="5" fill="#c98f88" opacity="0.7" />
      <circle cx="96" cy="28" r="8" fill="#f0d5d0" opacity="0.8" />
      <circle cx="72" cy="10" r="8" fill="#d4a8a2" opacity="0.8" />
      <circle cx="68" cy="28" r="9" fill="#e8c4c0" opacity="0.75" />
      <path d="M78 4 Q72 -4 78 -10 Q84 -2 78 4Z" fill="#30401c" opacity="0.5" />
      <path
        d="M94 10 Q102 4 104 10 Q98 18 94 10Z"
        fill="#30401c"
        opacity="0.45"
      />
      <path
        d="M64 20 Q56 14 58 8 Q66 12 64 20Z"
        fill="#30401c"
        opacity="0.45"
      />
      <path
        d="M60 40 Q52 36 54 28 Q62 32 60 40Z"
        fill="#30401c"
        opacity="0.4"
      />
      <circle cx="56" cy="52" r="5" fill="#f0d5d0" opacity="0.65" />
      <circle cx="48" cy="62" r="4" fill="#e8c4c0" opacity="0.6" />
    </svg>
  );
}

function LeafCornerBL() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 80 Q24 56 48 40"
        stroke="#30401c"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M0 80 Q32 60 52 44"
        stroke="#30401c"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      <path d="M8 72 Q0 60 6 52 Q16 60 8 72Z" fill="#30401c" opacity="0.5" />
      <path
        d="M20 64 Q12 52 20 44 Q28 52 20 64Z"
        fill="#30401c"
        opacity="0.45"
      />
      <path
        d="M32 56 Q24 44 34 38 Q40 46 32 56Z"
        fill="#30401c"
        opacity="0.4"
      />
      <path d="M4 60 Q-6 52 -2 44 Q8 50 4 60Z" fill="#30401c" opacity="0.35" />
      <circle cx="46" cy="38" r="7" fill="#e8c4c0" opacity="0.7" />
      <circle cx="46" cy="38" r="3" fill="#c98f88" opacity="0.55" />
      <circle cx="56" cy="44" r="5" fill="#f0d5d0" opacity="0.6" />
    </svg>
  );
}
