import type { TemplateKey } from "../types/invitation";

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
export function TemplateThumb({ template, groom = "Bekzod", bride = "Dilnoza", date = "12.06.2027", className = "" }: Props) {
  if (template === "anor") {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ background: "radial-gradient(circle at 50% 32%, #8f2436 0%, #5a1526 58%, #3c0d1b 100%)" }}
      >
        <img
          src="/templates/anor/pomegranate-vine.svg"
          alt=""
          className="absolute -left-6 top-1/2 h-[110%] -translate-y-1/2 opacity-25"
        />
        <img
          src="/templates/anor/pomegranate-vine.svg"
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
      <img src="/assets/arc.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <img
        src="/assets/couple.png"
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
