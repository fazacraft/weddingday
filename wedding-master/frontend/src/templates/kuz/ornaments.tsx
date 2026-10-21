/*
 * "Kuz" shablonining chizilgan bezaklari — chinor va eman barglari, chetan
 * (ryabina) mevalari, eman yong'og'i. Barchasi inline SVG, rasm fayllari kerak emas.
 */

import type { CSSProperties } from "react";

export type LeafKind = "maple" | "oak" | "birch";

export const LEAF_COLORS = {
  amber: "#e2a23a",
  gold: "#d8b24c",
  pumpkin: "#d8792f",
  rust: "#bb5226",
  crimson: "#a3321f",
  brown: "#8c5a2c",
  olive: "#8d8a42",
} as const;

export type LeafColor = keyof typeof LEAF_COLORS;

const VEIN = "rgba(255, 244, 222, 0.55)";
const STEM = "#7a5232";
const BERRY = "#c8321f";
const BERRY_DEEP = "#9a2214";

/* Barg shakllari — har biri o'z viewBox'ida, bandi pastda. */
const MAPLE_PATH =
  "M50 2 L56 14 L61 12 L58 34 L67 29 L72 23 L76 28 L93 21 L85 36 L91 40 L80 48 L64 52 L77 60 L88 63 L79 69 L69 70 L53 66 L52 97 L48 97 L47 66 L31 70 L21 69 L12 63 L23 60 L36 52 L20 48 L9 40 L15 36 L7 21 L24 28 L28 23 L33 29 L42 34 L39 12 L44 14 Z";
const MAPLE_VEINS = "M50 66 L50 10 M50 60 L86 26 M50 60 L14 26 M50 64 L82 63 M50 64 L18 63";

const OAK_PATH =
  "M30 98 L30 86 C24 86 20 82 22 77 C14 78 10 72 14 67 C6 66 4 58 11 54 C4 50 4 42 12 40 C6 34 8 26 16 26 C14 18 20 12 26 14 C26 8 28 4 30 2 C32 4 34 8 34 14 C40 12 46 18 44 26 C52 26 54 34 48 40 C56 42 56 50 49 54 C56 58 54 66 46 67 C50 72 46 78 38 77 C40 82 36 86 30 86 Z";
const OAK_VEINS = "M30 86 L30 8 M30 70 L16 62 M30 70 L44 62 M30 52 L14 44 M30 52 L46 44 M30 34 L18 28 M30 34 L42 28";

const BIRCH_PATH = "M20 98 L20 84 C6 76 2 54 6 36 C10 18 18 6 20 2 C22 6 30 18 34 36 C38 54 34 76 20 84 Z";
const BIRCH_VEINS = "M20 84 L20 8 M20 64 L10 54 M20 64 L30 54 M20 44 L11 34 M20 44 L29 34";

const SHAPES: Record<LeafKind, { viewBox: string; path: string; veins: string }> = {
  maple: { viewBox: "0 0 100 100", path: MAPLE_PATH, veins: MAPLE_VEINS },
  oak: { viewBox: "0 0 60 100", path: OAK_PATH, veins: OAK_VEINS },
  birch: { viewBox: "0 0 40 100", path: BIRCH_PATH, veins: BIRCH_VEINS },
};

/** Alohida barg (tushayotgan barglar va kichik belgilar uchun). */
export function LeafIcon({
  kind = "maple",
  color = "rust",
  className = "",
  style,
}: {
  kind?: LeafKind;
  color?: LeafColor;
  className?: string;
  style?: CSSProperties;
}) {
  const shape = SHAPES[kind];
  const fill = LEAF_COLORS[color];
  return (
    <svg viewBox={shape.viewBox} className={className} style={style} aria-hidden="true">
      <path d={shape.path} fill={fill} stroke={fill} strokeWidth="2" strokeLinejoin="round" />
      <path d={shape.veins} stroke={VEIN} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** SVG ichida joylashtiriladigan barg: (x, y) — bandning uchi, s — masshtab (≈ 1 → 50px). */
function Leaf({
  x,
  y,
  kind = "maple",
  color = "rust",
  rotate = 0,
  s = 1,
}: {
  x: number;
  y: number;
  kind?: LeafKind;
  color?: LeafColor;
  rotate?: number;
  s?: number;
}) {
  const shape = SHAPES[kind];
  const width = kind === "maple" ? 100 : kind === "oak" ? 60 : 40;
  const fill = LEAF_COLORS[color];
  // Barg bandining uchini (x, y) nuqtaga qo'yamiz va shu nuqta atrofida aylantiramiz
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s * 0.5}) translate(${-width / 2} -98)`}>
      <path d={shape.path} fill={fill} stroke={fill} strokeWidth="2" strokeLinejoin="round" />
      <path d={shape.veins} stroke={VEIN} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Chetan (ryabina) mevalari to'plami. */
function Berries({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const dots: [number, number, number][] = [
    [0, 0, 4.2],
    [7, -3, 3.8],
    [3, 6, 4],
    [-6, 5, 3.6],
    [10, 5, 3.4],
    [-3, -7, 3.4],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 L-2 -14 M7 -3 L4 -14 M3 6 L-2 -14 M-6 5 L-2 -14" stroke={STEM} strokeWidth="0.9" fill="none" />
      {dots.map(([dx, dy, r], i) => (
        <g key={i}>
          <circle cx={dx} cy={dy} r={r} fill={i % 2 ? BERRY_DEEP : BERRY} />
          <circle cx={dx - r * 0.35} cy={dy - r * 0.35} r={r * 0.3} fill="#ffd9c4" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

/** Eman yong'og'i (jo'ka). */
function Acorn({ x, y, s = 1, rotate = 0 }: { x: number; y: number; s?: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <path d="M-8 0 C-9 10 -4 18 0 20 C4 18 9 10 8 0Z" fill="#c98a45" />
      <path d="M-4 3 C-4 10 -2 14 0 16" stroke="#e8b878" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M-10 1 C-10 -6 -5 -9 0 -9 C5 -9 10 -6 10 1 Z" fill="#7a4d27" />
      <path d="M-8 -3 L8 -3 M-9 0 L9 0 M-6 -6 L6 -6" stroke="#5e3a1c" strokeWidth="0.8" />
      <path d="M0 -9 C0 -12 2 -14 4 -15" stroke={STEM} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Gorizontal kuz novdasi — sarlavha ustida, footer'da. */
export function AutumnGarland({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 90" fill="none" className={className} aria-hidden="true">
      <path d="M10 40 Q76 58 140 46 Q204 58 270 40" stroke={STEM} strokeWidth="1.8" strokeLinecap="round" />
      <Leaf x={64} y={50} kind="oak" color="olive" rotate={-120} s={0.6} />
      <Leaf x={216} y={50} kind="oak" color="olive" rotate={120} s={0.6} />
      <Leaf x={40} y={46} kind="birch" color="gold" rotate={-70} s={0.55} />
      <Leaf x={240} y={46} kind="birch" color="gold" rotate={70} s={0.55} />
      <Leaf x={100} y={52} kind="maple" color="amber" rotate={-150} s={0.55} />
      <Leaf x={180} y={52} kind="maple" color="amber" rotate={150} s={0.55} />
      <Leaf x={122} y={48} kind="maple" color="pumpkin" rotate={-35} s={0.62} />
      <Leaf x={158} y={48} kind="maple" color="crimson" rotate={35} s={0.62} />
      <Leaf x={140} y={46} kind="maple" color="rust" rotate={0} s={0.78} />
      <Berries x={112} y={60} s={0.9} />
      <Berries x={170} y={60} s={0.9} />
      <Acorn x={24} y={50} s={0.7} rotate={-20} />
      <Acorn x={256} y={50} s={0.7} rotate={20} />
    </svg>
  );
}

/** Karta burchagidagi kichik barg to'plami. */
export function LeafCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 110" fill="none" className={className} aria-hidden="true">
      <Leaf x={60} y={80} kind="oak" color="olive" rotate={-70} s={0.7} />
      <Leaf x={60} y={80} kind="birch" color="gold" rotate={60} s={0.75} />
      <Leaf x={60} y={80} kind="maple" color="pumpkin" rotate={-25} s={0.8} />
      <Leaf x={62} y={80} kind="maple" color="crimson" rotate={28} s={0.62} />
      <Berries x={70} y={84} s={1} />
      <Acorn x={44} y={88} s={0.75} rotate={-30} />
    </svg>
  );
}

/** Kirish kartasidagi novda (tik, burchakdan chiqadi). */
export function CornerSprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <path d="M4 4 Q40 30 58 70 Q66 90 70 116" stroke={STEM} strokeWidth="1.6" strokeLinecap="round" />
      <Leaf x={26} y={20} kind="maple" color="rust" rotate={70} s={0.6} />
      <Leaf x={46} y={44} kind="oak" color="olive" rotate={-40} s={0.5} />
      <Leaf x={58} y={70} kind="maple" color="amber" rotate={60} s={0.5} />
      <Leaf x={66} y={96} kind="birch" color="gold" rotate={-30} s={0.45} />
      <Berries x={38} y={36} s={0.8} />
    </svg>
  );
}

/**
 * Rasm atrofidagi gulchambar: oval bo'ylab chap-pastki va o'ng-yuqori yoylarda
 * barglar. (cx, cy) — markaz, (rx, ry) — oval radiuslari.
 */
const WREATH_COLORS: LeafColor[] = ["rust", "amber", "olive", "crimson", "gold", "pumpkin", "brown"];
const WREATH_KINDS: LeafKind[] = ["maple", "birch", "oak", "maple", "birch", "maple", "oak"];

function wreathArc(from: number, to: number, count: number, cx: number, cy: number, rx: number, ry: number, offset: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    const deg = from + (to - from) * t;
    const rad = (deg * Math.PI) / 180;
    // Uchlarda barglar kichrayadi — yoy yumshoq tugaydi
    const scale = 0.42 + 0.3 * Math.sin(Math.PI * t);
    const outward = deg + 90 + (i % 2 ? 28 : -28);
    return {
      x: cx + rx * Math.cos(rad),
      y: cy + ry * Math.sin(rad),
      rotate: outward,
      s: scale,
      kind: WREATH_KINDS[(i + offset) % WREATH_KINDS.length],
      color: WREATH_COLORS[(i + offset) % WREATH_COLORS.length],
    };
  });
}

/** Barglar o'tirgan oval yoy — novda. */
function arcPath(from: number, to: number, cx: number, cy: number, rx: number, ry: number) {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(cx + rx * Math.cos(rad)).toFixed(1)} ${(cy + ry * Math.sin(rad)).toFixed(1)}`;
  };
  return `M${point(from)} A${rx} ${ry} 0 0 1 ${point(to)}`;
}

const WREATH_ARCS: [number, number, number, number][] = [
  [95, 215, 11, 0],
  [-80, 5, 8, 3],
];
const WREATH = WREATH_ARCS.flatMap(([from, to, count, offset]) => wreathArc(from, to, count, 150, 185, 128, 160, offset));
const WREATH_STEMS = WREATH_ARCS.map(([from, to]) => arcPath(from - 6, to + 6, 150, 185, 128, 160));

export function LeafWreath({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 370" fill="none" className={className} aria-hidden="true">
      {WREATH_STEMS.map((d) => (
        <path key={d} d={d} stroke={STEM} strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {WREATH.map((l, i) => (
        <Leaf key={i} x={l.x} y={l.y} kind={l.kind} color={l.color} rotate={l.rotate} s={l.s} />
      ))}
      <Berries x={44} y={290} s={1.1} />
      <Berries x={256} y={72} s={1} />
      <Acorn x={82} y={334} s={0.9} rotate={-35} />
      <Acorn x={276} y={160} s={0.8} rotate={70} />
    </svg>
  );
}

/** Ingichka chiziq — kichik chinor bargi — ingichka chiziq. */
export function LeafDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`leaf-divider ${className}`} aria-hidden="true">
      <span />
      <LeafIcon kind="maple" color="rust" className="leaf-divider-icon" />
      <span />
    </div>
  );
}

/** Dastur vaqt chizig'idagi belgi — eman yong'og'i va barg. */
export function AcornMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-30 -30 60 60" className={className} aria-hidden="true">
      <Leaf x={0} y={6} kind="oak" color="olive" rotate={-55} s={0.42} />
      <Leaf x={0} y={6} kind="maple" color="amber" rotate={45} s={0.4} />
      <Acorn x={0} y={-2} s={1.05} />
    </svg>
  );
}

/** Muhr ustidagi bo'rtma chinor bargi. */
export function SealLeaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={MAPLE_PATH} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d={MAPLE_VEINS} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Kalendardagi to'y kuni belgisi. */
export function MapleShape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={MAPLE_PATH} fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
