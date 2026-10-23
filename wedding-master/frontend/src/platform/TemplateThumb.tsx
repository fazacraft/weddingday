import type { TemplateKey } from "../types/invitation";
import { withBase } from "../lib/base";
import { GoldSeal } from "../templates/osmon/ornaments";

interface Props {
  template: TemplateKey;
  groom?: string;
  bride?: string;
  date?: string;
  className?: string;
}

/**
 * Shablonning yengil miniatyurasi (iframe'siz) — landing, wizard va kabinetdagi
 * kartochkalar uchun. Har bir shablonning asosiy "kirish" ko'rinishini eslatadi.
 */
export function TemplateThumb({ template, groom = "Mirodil", bride = "Jasmina", date = "12.06.2027", className = "" }: Props) {
  if (template === "osmon") {
    return (
      <div className={`relative overflow-hidden bg-[#f4f1ec] ${className}`}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#f6f3ee] to-[#ebe7e0]"
          style={{ clipPath: "polygon(0 0,50% 49%,0 100%)", filter: "drop-shadow(0 0 4px rgba(80,70,60,.15))" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-l from-[#f6f3ee] to-[#ebe7e0]"
          style={{ clipPath: "polygon(100% 0,50% 49%,100% 100%)" }}
        />
        <div className="absolute inset-0 bg-[#f1ede7]" style={{ clipPath: "polygon(0 100%,50% 54%,100% 100%)" }} />
        <div
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#faf8f4] to-[#ece8e1]"
          style={{ clipPath: "polygon(0 0,100% 0,100% 2%,56% 86%,50% 94%,44% 86%,0 2%)", filter: "drop-shadow(0 4px 6px rgba(80,70,60,.15))" }}
        />
        <div className="absolute inset-x-0 top-[12%] flex flex-col items-center px-4 text-center">
          <span style={{ fontFamily: '"Imperial Script", cursive' }} className="text-[30px] leading-tight text-[#64a0bd]">
            {groom} & {bride}
          </span>
        </div>
        <GoldSeal className="absolute left-1/2 top-[47%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_6px_8px_rgba(90,64,20,0.35)]" />
        <div className="absolute inset-x-0 top-[62%] flex flex-col items-center gap-1.5">
          <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#6f6a64]" style={{ fontFamily: "Rufina, serif" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#64a0bd]" />
            Ochish uchun bosing
          </span>
          <span className="text-[10px] tracking-[0.3em] text-[#52839c]" style={{ fontFamily: "Rufina, serif" }}>{date}</span>
        </div>
      </div>
    );
  }

  if (template === "kuz") {
    const monogram = (
      <>
        {(groom.trim()[0] ?? "").toUpperCase()}
        <span style={{ fontFamily: '"Playfair Display", serif' }} className="mx-px align-[0.15em] text-[0.6em] italic">&amp;</span>
        {(bride.trim()[0] ?? "").toUpperCase()}
      </>
    );
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ background: "radial-gradient(circle at 50% 38%, #fff3dc 0%, #f4cf91 34%, #d88a45 68%, #8c3c1c 100%)" }}
      >
        {[
          { pos: "left-[7%] top-[12%] rotate-[25deg]", kind: "maple", color: "#bb5226", size: "h-5 w-5" },
          { pos: "right-[10%] top-[20%] -rotate-[30deg]", kind: "oak", color: "#8d8a42", size: "h-6 w-4" },
          { pos: "left-[14%] bottom-[14%] rotate-[60deg]", kind: "oak", color: "#d8792f", size: "h-5 w-3" },
          { pos: "right-[7%] bottom-[24%] rotate-[10deg]", kind: "maple", color: "#e2a23a", size: "h-4 w-4" },
        ].map((leaf) => (
          <svg
            key={leaf.pos}
            viewBox={leaf.kind === "maple" ? "0 0 100 100" : "0 0 60 100"}
            className={`absolute ${leaf.pos} ${leaf.size}`}
            aria-hidden="true"
          >
            <path
              fill={leaf.color}
              d={
                leaf.kind === "maple"
                  ? "M50 2 L56 14 L61 12 L58 34 L67 29 L72 23 L76 28 L93 21 L85 36 L91 40 L80 48 L64 52 L77 60 L88 63 L79 69 L69 70 L53 66 L52 97 L48 97 L47 66 L31 70 L21 69 L12 63 L23 60 L36 52 L20 48 L9 40 L15 36 L7 21 L24 28 L28 23 L33 29 L42 34 L39 12 L44 14 Z"
                  : "M30 98 L30 86 C24 86 20 82 22 77 C14 78 10 72 14 67 C6 66 4 58 11 54 C4 50 4 42 12 40 C6 34 8 26 16 26 C14 18 20 12 26 14 C26 8 28 4 30 2 C32 4 34 8 34 14 C40 12 46 18 44 26 C52 26 54 34 48 40 C56 42 56 50 49 54 C56 58 54 66 46 67 C50 72 46 78 38 77 C40 82 36 86 30 86 Z"
              }
            />
          </svg>
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#7a2a1a]/70">To'y taklifnomasi</span>
          <div className="relative h-[66%] aspect-[3/4] shadow-[0_18px_40px_-12px_rgba(80,25,8,0.6)]">
            {["left-0 rounded-l-[6px]", "right-0 rounded-r-[6px]"].map((side) => (
              <div
                key={side}
                className={`absolute inset-y-0 w-1/2 ${side}`}
                style={{ background: "linear-gradient(165deg,#e9cb98 0%,#dbb47a 55%,#cfa266 100%)" }}
              />
            ))}
            <div className="absolute inset-x-[16%] bottom-1/2 rounded-[4px] bg-[#fffaf0] px-1 pb-2 pt-1.5 text-center shadow-[0_6px_14px_-6px_rgba(70,30,10,0.6)] -rotate-2">
              <span style={{ fontFamily: '"Pinyon Script", cursive' }} className="block text-[13px] leading-tight text-[#bb5226]">
                {groom} <span style={{ fontFamily: '"Playfair Display", serif' }} className="text-[0.75em] italic text-[#e2a23a]">&amp;</span> {bride}
              </span>
            </div>
            <span
              className="absolute inset-x-0 top-[60%] h-[3px] -translate-y-1/2"
              style={{ background: "repeating-linear-gradient(-55deg,#a98250 0 2px,#7f5b30 2px 4px)" }}
            />
            <span
              className="absolute left-1/2 top-[60%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] text-[#fff3e2]"
              style={{
                background: "radial-gradient(circle at 35% 30%,#d66b3d,#a63b1d 58%,#6c2210 100%)",
                fontFamily: '"Pinyon Script", cursive',
              }}
            >
              {monogram}
            </span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#fff3e2]/90">{date}</p>
        </div>
      </div>
    );
  }

  if (template === "atirgul") {
    const monogram = `${groom.trim()[0] ?? ""}&${bride.trim()[0] ?? ""}`.toUpperCase();
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ background: "radial-gradient(circle at 50% 30%, #ffffff 0%, #fde6ec 48%, #f5c3cf 100%)" }}
      >
        {[
          "left-[6%] top-[10%] h-3 w-2.5 rotate-12",
          "right-[12%] top-[18%] h-4 w-3 -rotate-12",
          "left-[18%] bottom-[16%] h-3.5 w-2.5 rotate-45",
          "right-[8%] bottom-[28%] h-3 w-2 -rotate-45",
        ].map((pos) => (
          <span key={pos} className={`absolute rounded-[0_70%_0_70%] bg-[#f2a9b9]/80 ${pos}`} />
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5">
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#b84a68]/60">To'y taklifnomasi</span>
          <div
            className="relative w-[82%] aspect-[3/2] rounded-[6px] shadow-[0_18px_40px_-12px_rgba(184,74,104,0.45)]"
            style={{ background: "linear-gradient(180deg,#fbe4ea,#f6d3dc)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg,#ffffff 0%,#fff3f6 70%,#fde7ed 100%)",
                clipPath: "polygon(0 0,100% 0,50% 68%)",
              }}
            />
            <div
              className="absolute inset-0 flex items-end justify-center pb-[4%]"
              style={{
                background: "linear-gradient(180deg,#fffafb 0%,#fdeef2 60%,#fbe2e9 100%)",
                clipPath: "polygon(0 100%,100% 100%,100% 35%,50% 62%,0 35%)",
              }}
            >
              <span style={{ fontFamily: '"Parisienne", cursive' }} className="text-[#a63c5a] text-base leading-none">
                {groom} & {bride}
              </span>
            </div>
            <span
              className="absolute left-1/2 top-[55%] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] text-white"
              style={{
                background: "radial-gradient(circle at 35% 30%,#ec9fb2,#c75a78 60%,#9c3555 100%)",
                fontFamily: '"Parisienne", cursive',
              }}
            >
              {monogram}
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b84a68]/70">{date}</p>
        </div>
      </div>
    );
  }

  if (template === "anor") {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ background: "radial-gradient(circle at 50% 32%, #8f2436 0%, #5a1526 58%, #3c0d1b 100%)" }}
      >
        <img
          src={withBase("/templates/anor/pomegranate-vine.svg")}
          alt=""
          className="absolute -left-6 top-1/2 h-[110%] -translate-y-1/2 opacity-25"
        />
        <img
          src={withBase("/templates/anor/pomegranate-vine.svg")}
          alt=""
          className="absolute -right-6 top-1/2 h-[110%] -translate-y-1/2 -scale-x-100 opacity-25"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5">
          <div
            className="relative w-[82%] aspect-[3/2] rounded-[4px] shadow-[0_18px_40px_rgba(20,4,9,0.55)]"
            style={{ background: "linear-gradient(180deg,#efe2c8,#e3d2b0)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg,#fbf4e3 0%,#f1e4c8 62%,#e9d8b6 100%)",
                clipPath: "polygon(0 0,100% 0,50% 68%)",
              }}
            />
            <div
              className="absolute inset-0 flex items-end justify-center pb-[4%]"
              style={{
                background: "linear-gradient(180deg,#f9f1de 0%,#f0e3c6 58%,#e7d5b1 100%)",
                clipPath: "polygon(0 100%,100% 100%,100% 35%,50% 62%,0 35%)",
              }}
            >
              <span style={{ fontFamily: '"Great Vibes", cursive' }} className="text-[#6e2323] text-base leading-none">
                {groom} va {bride}
              </span>
            </div>
            <span
              className="absolute left-1/2 top-[55%] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[8px] font-semibold uppercase tracking-widest text-[#f8ecd4]"
              style={{ background: "radial-gradient(circle at 35% 30%,#c0504f,#8f2b2b 62%,#6e2020 100%)" }}
            >
              Ochish
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#f1e4c8]/70">{date}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-cream ${className}`}>
      <img src={withBase("/assets/arc.webp")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <img
        src={withBase("/assets/couple.webp")}
        alt=""
        className="absolute bottom-0 left-1/2 h-[72%] -translate-x-1/2 object-contain"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-cream via-cream/60 to-transparent" />
      <div className="absolute inset-x-0 top-[9%] flex flex-col items-center gap-1 px-4 text-center">
        <span className="text-[9px] uppercase tracking-[0.3em] text-forest/50">To'y taklifnomasi</span>
        <span className="font-script text-[28px] leading-none text-forest [text-shadow:0_0_14px_#fff]">
          {groom} & {bride}
        </span>
      </div>
      <p className="absolute inset-x-0 bottom-4 text-center font-formal italic text-sm text-forest/80">{date}</p>
    </div>
  );
}
