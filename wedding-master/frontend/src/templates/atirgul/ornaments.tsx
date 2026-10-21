/*
 * "Atirgul" shablonining chizilgan bezaklari — barchasi inline SVG, shuning
 * uchun alohida rasm fayllari kerak emas va har qanday o'lchamda tiniq chiqadi.
 */

type Tone = "light" | "mid" | "deep";

const TONES: Record<Tone, { outer: string; mid: string; inner: string; core: string }> = {
  light: { outer: "#fde1e7", mid: "#f6b8c6", inner: "#e994a9", core: "#c4627c" },
  mid: { outer: "#f8c4d0", mid: "#ef9fb3", inner: "#d9718c", core: "#a9435f" },
  deep: { outer: "#f1a6b8", mid: "#e1849c", inner: "#c25775", core: "#8f3050" },
};

const LEAF = "#b5c4ab";
const LEAF_DARK = "#97ab8d";
const STEM = "#a3b596";

/** Bitta atirgul gul — markazi (x, y), radiusi taxminan 28·s. */
function Rose({ x, y, s = 1, tone = "mid", rotate = 0 }: { x: number; y: number; s?: number; tone?: Tone; rotate?: number }) {
  const c = TONES[tone];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <circle r="28" fill={c.outer} />
      <path d="M-27 5 C-29 -16 -8 -31 9 -25 C-6 -22 -18 -12 -16 5Z" fill={c.mid} opacity="0.85" />
      <path d="M27 -3 C29 18 10 31 -7 26 C8 24 20 14 18 -3Z" fill={c.mid} opacity="0.85" />
      <circle r="17" fill={c.mid} />
      <path d="M-11 0 C-11 -13 6 -17 12 -6 C4 -10 -4 -7 -4 0 C-4 7 5 9 9 3 C8 13 -11 13 -11 0Z" fill={c.inner} />
      <path d="M-2 -2 C-1 -7 6 -7 6 -1 C6 4 0 5 -1 1" stroke={c.core} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Leaf({ x, y, rotate, s = 1, dark = false }: { x: number; y: number; rotate: number; s?: number; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <path d="M0 0 C8 -10 22 -10 32 0 C22 10 8 10 0 0Z" fill={dark ? LEAF_DARK : LEAF} />
      <path d="M2 0 L28 0" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.8" />
    </g>
  );
}

function Bud({ x, y, rotate = 0, s = 1 }: { x: number; y: number; rotate?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <path d="M0 6 C-7 0 -6 -10 0 -14 C6 -10 7 0 0 6Z" fill="#ef9fb3" />
      <path d="M0 6 C-4 2 -6 -4 -5 -8 M0 6 C4 2 6 -4 5 -8" stroke={LEAF_DARK} strokeWidth="1.6" fill="none" />
    </g>
  );
}

/** Yon tomondagi tik atirgul novdasi (kirish ekrani va sahifa chetlari uchun). */
export function RoseBranch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 360" fill="none" className={className} aria-hidden="true">
      <path d="M84 352 Q72 280 62 210 Q52 140 58 82 Q62 40 86 8" stroke={STEM} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M66 214 Q44 198 30 182" stroke={STEM} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M60 150 Q40 132 30 114" stroke={STEM} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M62 96 Q50 76 44 58" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M72 268 Q58 256 46 252" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />

      <Leaf x={64} y={186} rotate={-130} s={0.9} />
      <Leaf x={60} y={128} rotate={-140} s={0.8} dark />
      <Leaf x={62} y={176} rotate={-20} s={0.75} dark />
      <Leaf x={60} y={112} rotate={-25} s={0.7} />
      <Leaf x={68} y={240} rotate={-150} s={0.75} />
      <Leaf x={70} y={300} rotate={-30} s={0.7} dark />

      <Rose x={28} y={178} s={0.95} tone="mid" rotate={-10} />
      <Rose x={30} y={112} s={0.7} tone="light" rotate={20} />
      <Rose x={86} y={10} s={0.55} tone="deep" />
      <Bud x={44} y={56} rotate={-25} s={1.1} />
      <Bud x={46} y={252} rotate={-60} s={0.9} />
    </svg>
  );
}

/** Gorizontal gulchambar — sarlavha ustida yoki bo'limlar orasida. */
export function RoseGarland({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 80" fill="none" className={className} aria-hidden="true">
      <path d="M8 52 Q70 30 130 44 Q190 30 252 52" stroke={STEM} strokeWidth="1.6" strokeLinecap="round" />
      <Leaf x={96} y={44} rotate={190} s={0.9} />
      <Leaf x={164} y={44} rotate={-10} s={0.9} />
      <Leaf x={60} y={40} rotate={200} s={0.7} dark />
      <Leaf x={200} y={40} rotate={-20} s={0.7} dark />
      <Leaf x={112} y={52} rotate={150} s={0.6} dark />
      <Leaf x={148} y={52} rotate={30} s={0.6} dark />
      <Bud x={24} y={46} rotate={-70} s={0.8} />
      <Bud x={236} y={46} rotate={70} s={0.8} />
      <Rose x={78} y={38} s={0.5} tone="light" rotate={-15} />
      <Rose x={182} y={38} s={0.5} tone="light" rotate={15} />
      <Rose x={130} y={38} s={0.85} tone="mid" />
    </svg>
  );
}

/** Karta burchagidagi kichik gul to'plami. */
export function RoseCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <Leaf x={52} y={58} rotate={150} s={1.1} />
      <Leaf x={62} y={56} rotate={20} s={1.1} dark />
      <Leaf x={58} y={66} rotate={95} s={0.9} />
      <Rose x={40} y={48} s={0.85} tone="mid" rotate={-12} />
      <Rose x={80} y={56} s={0.6} tone="light" rotate={18} />
      <Bud x={70} y={24} rotate={30} s={1} />
    </svg>
  );
}

/** Ingichka chiziq — kichik gul — ingichka chiziq. */
export function RoseDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`rose-divider ${className}`} aria-hidden="true">
      <span />
      <svg viewBox="-32 -32 64 64" width="26" height="26">
        <Rose x={0} y={0} s={1} tone="mid" />
      </svg>
      <span />
    </div>
  );
}

/** Dastur vaqt chizig'idagi bitta gul belgisi. */
export function RoseMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-34 -34 68 68" className={className} aria-hidden="true">
      <Leaf x={4} y={10} rotate={30} s={0.8} />
      <Leaf x={-4} y={10} rotate={150} s={0.8} dark />
      <Rose x={0} y={0} s={0.9} tone="deep" />
    </svg>
  );
}

export function HeartShape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 30" className={className} aria-hidden="true">
      <path d="M16 29 C6 21 0 15 0 8.5 C0 3.6 3.7 0 8.3 0 C11.4 0 14.3 1.7 16 4.4 C17.7 1.7 20.6 0 23.7 0 C28.3 0 32 3.6 32 8.5 C32 15 26 21 16 29Z" />
    </svg>
  );
}
