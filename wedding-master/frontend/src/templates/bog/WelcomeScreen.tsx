import { motion } from 'framer-motion';
import { useInvitation } from '../shared/InvitationContext';
import { useLang } from '../../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

/** "2026-10-29" → "29 Oktabr, 2026" (mehmon qaysi vaqt zonasida bo'lmasin, sana o'zgarmaydi). */
function formatWeddingDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${UZ_MONTHS[m - 1]}, ${y}`;
}

interface Props {
  onEnter: () => void;
}

export function WelcomeScreen({ onEnter }: Props) {
  const { t } = useLang();
  const { data: wedding } = useInvitation();
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-cream flex flex-col items-center justify-center px-6 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Til almashtirish — faqat kirish ekranida */}
      <motion.div
        className="absolute top-6 inset-x-0 z-30 flex justify-center px-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
      >
        <LanguageToggle />
      </motion.div>

      {/* Corner ornaments */}
      <CornerOrnament className="absolute top-5 left-5 opacity-20" />
      <CornerOrnament className="absolute top-5 right-5 opacity-20 scale-x-[-1]" />
      <CornerOrnament className="absolute bottom-5 left-5 opacity-20 scale-y-[-1]" />
      <CornerOrnament className="absolute bottom-5 right-5 opacity-20 -scale-x-100 scale-y-[-1]" />

      {/* Floating flowers — left side */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FloralBranchSVG className="w-36 sm:w-48 opacity-55" />
        </motion.div>
      </motion.div>

      {/* Floating flowers — right side (mirrored) */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none scale-x-[-1]"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <FloralBranchSVG className="w-36 sm:w-48 opacity-55" />
        </motion.div>
      </motion.div>

      {/* Small flowers top center */}
      <motion.div
        className="absolute top-16 pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <SmallFlowerClusterSVG className="w-24 opacity-30" />
        </motion.div>
      </motion.div>

      {/* Small flowers bottom center */}
      <motion.div
        className="absolute bottom-16 pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <motion.div
          animate={{ rotate: [0, -4, 4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <SmallFlowerClusterSVG className="w-24 opacity-30 rotate-180" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="flex flex-col items-center gap-2 mb-6"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.05 }}
      >
        <div className="flex items-center gap-3">
          <span className="h-px w-8 sm:w-12 bg-forest/20" />
          <span className="text-forest/25 text-[10px] tracking-widest">✦</span>
          <span className="h-px w-8 sm:w-12 bg-forest/20" />
        </div>
        <h2 className="font-body text-[11px] sm:text-xs tracking-[0.35em] uppercase text-forest/45 text-center">
          {t(`${wedding.eventTitle} taklifnomasi`)}
        </h2>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 sm:w-12 bg-forest/20" />
          <span className="text-forest/25 text-[10px] tracking-widest">✦</span>
          <span className="h-px w-8 sm:w-12 bg-forest/20" />
        </div>
      </motion.div>

      {/* Top floral divider */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      >
        <span className="h-px w-16 sm:w-24 bg-forest/20" />
        <FloralOrnamentSVG />
        <span className="h-px w-16 sm:w-24 bg-forest/20" />
      </motion.div>

      {/* Couple names */}
      <motion.h1
        className="w-full max-w-lg flex items-center justify-center
                   font-script text-5xl sm:text-6xl md:text-7xl text-forest leading-none
                   [text-shadow:0_0_32px_rgba(255,255,255,0.9),0_0_16px_rgba(255,255,255,0.8)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.25 }}
      >
        <span className="flex-1 text-right">{t(wedding.groomName)}</span>
        <span className="font-formal not-italic text-3xl sm:text-5xl w-12 sm:w-16 text-center shrink-0 opacity-50">&</span>
        <span className="flex-1 text-left">{t(wedding.brideName)}</span>
      </motion.h1>

      {/* Date + venue — column */}
      <motion.div
        className="flex flex-col items-center gap-1 mt-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.45 }}
      >
        <p className="font-formal italic text-xl sm:text-2xl text-forest/60 tracking-wide text-center">
          {t(formatWeddingDate(wedding.date))}
        </p>
        <span className="text-forest/25 text-xs">✦</span>
        <p className="font-formal italic text-lg sm:text-xl text-forest/50 tracking-wide text-center">
          {t(wedding.venueName)}
        </p>
      </motion.div>

      {/* Separator */}
      <motion.div
        className="flex items-center gap-3 my-8"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.65 }}
      >
        <span className="h-px w-10 bg-forest/20" />
        <span className="text-forest/30 text-xs">✦</span>
        <span className="h-px w-10 bg-forest/20" />
      </motion.div>

      {/* Enter button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.8 }}
      >
        <motion.button
          onClick={onEnter}
          className="relative group flex items-center gap-3 px-10 py-4
                     bg-forest text-cream font-formal text-lg sm:text-xl tracking-widest
                     rounded-full border border-forest
                     hover:bg-forest/90 active:scale-[0.97] transition-colors duration-200
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
          animate={{
            boxShadow: [
              '0 0 0px rgba(48,64,28,0), 0 0 0px rgba(48,64,28,0)',
              '0 0 22px rgba(48,64,28,0.3), 0 0 8px rgba(48,64,28,0.15)',
              '0 0 0px rgba(48,64,28,0), 0 0 0px rgba(48,64,28,0)',
            ],
            scale: [1, 1.025, 1],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          <MusicNoteSVG className="w-4 h-4 opacity-70" />
          <span>{t('Kirish')}</span>
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRightSVG className="w-4 h-4 opacity-70" />
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Helper text */}
      <motion.p
        className="font-body text-[10px] tracking-[0.25em] uppercase text-forest/30 mt-5 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
      >
        {t('Musiqali kirishingiz uchun bosing')}
      </motion.p>
    </motion.div>
  );
}

/* ── Icons ──────────────────────────────────────────────────────────── */
function MusicNoteSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" />
    </svg>
  );
}

function ArrowRightSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function FloralOrnamentSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="3" fill="#30401c" opacity="0.4" />
      <circle cx="14" cy="6" r="2.5" fill="#30401c" opacity="0.2" />
      <circle cx="14" cy="22" r="2.5" fill="#30401c" opacity="0.2" />
      <circle cx="6" cy="14" r="2.5" fill="#30401c" opacity="0.2" />
      <circle cx="22" cy="14" r="2.5" fill="#30401c" opacity="0.2" />
      <circle cx="8.5" cy="8.5" r="1.8" fill="#30401c" opacity="0.15" />
      <circle cx="19.5" cy="8.5" r="1.8" fill="#30401c" opacity="0.15" />
      <circle cx="8.5" cy="19.5" r="1.8" fill="#30401c" opacity="0.15" />
      <circle cx="19.5" cy="19.5" r="1.8" fill="#30401c" opacity="0.15" />
    </svg>
  );
}

/* ── Floral branch — chap/o'ng ──────────────────────────────────────── */
function FloralBranchSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 340" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} aria-hidden="true">
      {/* Main stem */}
      <path d="M80 330 Q70 260 60 200 Q50 140 55 80 Q58 40 80 10"
        stroke="#30401c" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Branch 1 */}
      <path d="M65 200 Q40 185 20 170" stroke="#30401c" strokeWidth="1.5"
        fill="none" strokeLinecap="round" opacity="0.35" />
      {/* Branch 2 */}
      <path d="M60 150 Q35 130 15 120" stroke="#30401c" strokeWidth="1.5"
        fill="none" strokeLinecap="round" opacity="0.3" />
      {/* Branch 3 */}
      <path d="M62 100 Q45 80 30 65" stroke="#30401c" strokeWidth="1.2"
        fill="none" strokeLinecap="round" opacity="0.3" />
      {/* Branch 4 small */}
      <path d="M70 250 Q55 238 40 232" stroke="#30401c" strokeWidth="1.2"
        fill="none" strokeLinecap="round" opacity="0.28" />

      {/* Flowers on branches */}
      {/* Flower at branch 1 end */}
      <circle cx="20" cy="170" r="10" fill="#e8c4c0" opacity="0.85" />
      <circle cx="20" cy="170" r="4" fill="#c98f88" opacity="0.6" />
      <circle cx="12" cy="163" r="7" fill="#f0d5d0" opacity="0.7" />
      <circle cx="28" cy="163" r="7" fill="#d4a8a2" opacity="0.7" />
      <circle cx="12" cy="177" r="6" fill="#f0d5d0" opacity="0.65" />
      <circle cx="28" cy="177" r="6" fill="#e8c4c0" opacity="0.65" />

      {/* Flower at branch 2 end */}
      <circle cx="15" cy="120" r="9" fill="#e8c4c0" opacity="0.8" />
      <circle cx="15" cy="120" r="3.5" fill="#c98f88" opacity="0.55" />
      <circle cx="8" cy="114" r="6" fill="#f0d5d0" opacity="0.65" />
      <circle cx="22" cy="114" r="6" fill="#d4a8a2" opacity="0.65" />
      <circle cx="8" cy="126" r="5.5" fill="#e8c4c0" opacity="0.6" />
      <circle cx="22" cy="126" r="5.5" fill="#f0d5d0" opacity="0.6" />

      {/* Flower at branch 3 end */}
      <circle cx="30" cy="65" r="8" fill="#e8c4c0" opacity="0.75" />
      <circle cx="30" cy="65" r="3" fill="#c98f88" opacity="0.5" />
      <circle cx="23" cy="59" r="5.5" fill="#f0d5d0" opacity="0.6" />
      <circle cx="37" cy="59" r="5.5" fill="#d4a8a2" opacity="0.6" />
      <circle cx="23" cy="71" r="5" fill="#e8c4c0" opacity="0.55" />
      <circle cx="37" cy="71" r="5" fill="#f0d5d0" opacity="0.55" />

      {/* Flower at branch 4 end */}
      <circle cx="40" cy="232" r="7" fill="#e8c4c0" opacity="0.7" />
      <circle cx="40" cy="232" r="2.8" fill="#c98f88" opacity="0.5" />
      <circle cx="34" cy="226" r="5" fill="#f0d5d0" opacity="0.6" />
      <circle cx="46" cy="226" r="5" fill="#d4a8a2" opacity="0.6" />

      {/* Leaves */}
      <path d="M55 180 Q42 165 48 150 Q62 162 55 180Z" fill="#30401c" opacity="0.3" />
      <path d="M58 130 Q44 118 50 104 Q64 115 58 130Z" fill="#30401c" opacity="0.28" />
      <path d="M63 90 Q52 76 58 63 Q70 74 63 90Z" fill="#30401c" opacity="0.25" />
      <path d="M67 240 Q56 228 60 215 Q72 224 67 240Z" fill="#30401c" opacity="0.25" />

      {/* Tiny buds on stem */}
      <circle cx="59" cy="200" r="4" fill="#e8c4c0" opacity="0.6" />
      <circle cx="57" cy="155" r="3.5" fill="#f0d5d0" opacity="0.55" />
      <circle cx="64" cy="108" r="3" fill="#e8c4c0" opacity="0.5" />
    </svg>
  );
}

/* ── Small flower cluster — top/bottom ──────────────────────────────── */
function SmallFlowerClusterSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} aria-hidden="true">
      {/* Center flower */}
      <circle cx="60" cy="28" r="8" fill="#e8c4c0" opacity="0.9" />
      <circle cx="60" cy="28" r="3.2" fill="#c98f88" opacity="0.65" />
      <circle cx="52" cy="22" r="6" fill="#f0d5d0" opacity="0.75" />
      <circle cx="68" cy="22" r="6" fill="#d4a8a2" opacity="0.75" />
      <circle cx="52" cy="34" r="5.5" fill="#e8c4c0" opacity="0.7" />
      <circle cx="68" cy="34" r="5.5" fill="#f0d5d0" opacity="0.7" />
      {/* Left flower */}
      <circle cx="28" cy="32" r="6" fill="#e8c4c0" opacity="0.8" />
      <circle cx="28" cy="32" r="2.5" fill="#c98f88" opacity="0.55" />
      <circle cx="22" cy="27" r="4.5" fill="#f0d5d0" opacity="0.65" />
      <circle cx="34" cy="27" r="4.5" fill="#d4a8a2" opacity="0.65" />
      <circle cx="22" cy="37" r="4" fill="#e8c4c0" opacity="0.6" />
      <circle cx="34" cy="37" r="4" fill="#f0d5d0" opacity="0.6" />
      {/* Right flower */}
      <circle cx="92" cy="32" r="6" fill="#e8c4c0" opacity="0.8" />
      <circle cx="92" cy="32" r="2.5" fill="#c98f88" opacity="0.55" />
      <circle cx="86" cy="27" r="4.5" fill="#f0d5d0" opacity="0.65" />
      <circle cx="98" cy="27" r="4.5" fill="#d4a8a2" opacity="0.65" />
      <circle cx="86" cy="37" r="4" fill="#e8c4c0" opacity="0.6" />
      <circle cx="98" cy="37" r="4" fill="#f0d5d0" opacity="0.6" />
      {/* Stems */}
      <path d="M60 36 Q58 44 56 50" stroke="#30401c" strokeWidth="1.2"
        fill="none" strokeLinecap="round" opacity="0.3" />
      <path d="M28 38 Q26 44 24 50" stroke="#30401c" strokeWidth="1"
        fill="none" strokeLinecap="round" opacity="0.25" />
      <path d="M92 38 Q90 44 88 50" stroke="#30401c" strokeWidth="1"
        fill="none" strokeLinecap="round" opacity="0.25" />
      {/* Leaves */}
      <path d="M58 42 Q50 38 52 30 Q60 36 58 42Z" fill="#30401c" opacity="0.2" />
      <path d="M62 42 Q70 38 68 30 Q60 36 62 42Z" fill="#30401c" opacity="0.2" />
    </svg>
  );
}

function CornerOrnament({ className = '' }: { className?: string }) {
  return (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className={className} aria-hidden="true">
      <path d="M4 4 Q36 4 68 4 Q68 36 68 68" stroke="#30401c" strokeWidth="1.5"
        fill="none" strokeLinecap="round" />
      <path d="M4 4 Q22 22 36 36" stroke="#30401c" strokeWidth="1"
        fill="none" strokeLinecap="round" opacity="0.5" />
      <circle cx="36" cy="4" r="3.5" fill="#30401c" opacity="0.55" />
      <circle cx="68" cy="36" r="3.5" fill="#30401c" opacity="0.55" />
      <circle cx="4" cy="4" r="2.5" fill="#30401c" />
    </svg>
  );
}
