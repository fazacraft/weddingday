import { ReactNode } from "react";
import { withBase } from "../lib/base";

/** Telefon ramkasi — ichida taklifnomaning jonli ko'rinishi (iframe) yoki miniatyura. */
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[2.6rem] border border-ink/10 bg-ink p-2.5 shadow-[0_40px_80px_-30px_rgba(31,26,23,0.55)] ${className}`}
    >
      <div className="absolute left-1/2 top-4 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-ivory">{children}</div>
    </div>
  );
}

/** Wizard/kabinetdagi jonli ko'rinish: /korinish sahifasini iframe ichida ochadi. */
export function LivePreview({ storageKey, className = "" }: { storageKey: string; className?: string }) {
  return (
    <PhoneFrame className={className}>
      <iframe
        title="Taklifnoma ko'rinishi"
        src={`${withBase("/korinish")}?key=${encodeURIComponent(storageKey)}`}
        className="h-full w-full border-0"
      />
    </PhoneFrame>
  );
}
