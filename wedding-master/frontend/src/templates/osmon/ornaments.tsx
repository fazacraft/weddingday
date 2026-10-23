import { CSSProperties, useId } from "react";

/*
 * "Osmon" shablonining chizilgan bezaklari — oltin muhr, qo'lda chizilgan
 * yurak, bulut, konvertlar va joy belgisi. Gradient'li SVG'lar bir sahifada
 * bir necha marta chiqadi, shuning uchun id'lar useId bilan noyob qilinadi.
 */

/** Yurak konturi (0..32 × 0..30). */
const HEART = "M16 29 C6 21 0 15 0 8.5 C0 3.6 3.7 0 8.3 0 C11.4 0 14.3 1.7 16 4.4 C17.7 1.7 20.6 0 23.7 0 C28.3 0 32 3.6 32 8.5 C32 15 26 21 16 29Z";

/** Oltin mum muhr — chetlari notekis, o'rtasida bo'rtib chiqqan yurak. */
export function GoldSeal({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fbe7b5" />
          <stop offset="0.45" stopColor="#e2c27e" />
          <stop offset="0.8" stopColor="#c39a52" />
          <stop offset="1" stopColor="#9c7434" />
        </radialGradient>
        <radialGradient id={`${id}h`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f3d697" />
          <stop offset="1" stopColor="#b98c45" />
        </radialGradient>
        <filter id={`${id}n`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.1  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      {/* Mumning oqib chiqqan notekis cheti */}
      <path
        d="M50 3 C61 3 66 7 74 10 C83 14 90 21 94 31 C98 40 97 47 97 54 C97 64 92 72 86 80 C79 89 69 95 58 97 C47 99 38 97 29 93 C19 88 11 80 6 70 C2 61 3 51 4 43 C6 31 12 22 21 14 C30 7 40 3 50 3Z"
        fill={`url(#${id}g)`}
      />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#a37b3c" strokeOpacity="0.45" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="34" fill={`url(#${id}g)`} opacity="0.6" />
      <g transform="translate(29 30) scale(1.32)">
        <path d={HEART} fill={`url(#${id}h)`} stroke="#9c7434" strokeWidth="1.1" strokeLinejoin="round" />
        <path d={HEART} fill="#000" filter={`url(#${id}n)`} />
        <path d="M5 8 C5 5 7 3 9.5 3" fill="none" stroke="#fff6dc" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <path d="M22 26 C28 17 38 12 48 11" fill="none" stroke="#fff6dc" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Qo'lda chizilgandek ikki chiziqli yurak. */
export function DoodleHeart({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 60" className={className} style={style} fill="none" aria-hidden="true">
      <path
        d="M32 56 C20 46 5 35 4 20 C3 10 10 4 18 4 C25 4 30 9 32 15 C34 8 40 3 47 4 C56 5 61 12 60 21 C58 35 44 46 32 56Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 52 C21 44 9 34 8 21 C7 13 12 8 19 8 C25 8 29 12 31 18 C34 11 39 7 46 8 C53 9 57 15 56 22"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pushti-ko'k tusli yumshoq bulut. */
export function Cloud({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 220 110" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#dcebf6" />
          <stop offset="1" stopColor="#f6d6e2" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a9cbe3" />
          <stop offset="1" stopColor="#f2c3a6" />
        </linearGradient>
        <filter id={`${id}b`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <g filter={`url(#${id}b)`}>
        <ellipse cx="112" cy="84" rx="100" ry="20" fill={`url(#${id}s)`} opacity="0.55" />
        <circle cx="62" cy="70" r="30" fill={`url(#${id}c)`} />
        <circle cx="104" cy="50" r="40" fill={`url(#${id}c)`} />
        <circle cx="150" cy="60" r="32" fill={`url(#${id}c)`} />
        <circle cx="186" cy="78" r="22" fill={`url(#${id}c)`} />
        <circle cx="30" cy="84" r="18" fill={`url(#${id}c)`} />
        <rect x="30" y="72" width="160" height="28" rx="14" fill={`url(#${id}c)`} />
      </g>
      <path d="M78 46 C86 34 100 28 114 30" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Kichik konvert (bo'limlar chetidagi bezak). */
export function EnvelopeDoodle({ tone, className = "" }: { tone: "gold" | "blue"; className?: string }) {
  const id = useId().replace(/:/g, "");
  const [light, dark, line] = tone === "gold" ? ["#f3dcaa", "#d9b878", "#c39a52"] : ["#dbeaf4", "#bcd6e8", "#9fc2db"];
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <rect x="2" y="14" width="116" height="68" rx="3" fill={`url(#${id}e)`} />
      <path d="M2 82 L60 44 L118 82" fill="none" stroke={line} strokeWidth="1.2" />
      <path d="M2 14 L60 54 L118 14 L60 -14Z" fill={light} stroke={line} strokeWidth="1" strokeLinejoin="round" />
      {tone === "blue" && (
        <g fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.9" strokeLinecap="round">
          <path d="M40 8 C46 2 54 4 56 10 C58 4 66 2 70 8" />
          <path d="M48 20 C52 16 58 18 60 22 C62 18 68 16 72 20" />
          <path d="M30 22 C34 26 38 26 42 22" />
          <path d="M78 22 C82 26 86 26 90 22" />
        </g>
      )}
    </svg>
  );
}

/** Ichida yurak bo'lgan joy belgisi. */
export function HeartPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 60" className={className} aria-hidden="true">
      <path d="M24 58 C24 58 4 36 4 22 C4 10 13 2 24 2 C35 2 44 10 44 22 C44 36 24 58 24 58Z" fill="currentColor" />
      <g transform="translate(14 13) scale(0.625)">
        <path d={HEART} fill="#fff" />
      </g>
    </svg>
  );
}

/** Kichik to'liq yurak (suzib yuruvchi bezak va belgilar uchun). */
export function HeartShape({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 32 30" className={className} style={style} aria-hidden="true">
      <path d={HEART} />
    </svg>
  );
}
