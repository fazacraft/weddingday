import { withBase } from "../../lib/base";
import { PAYMENT_CONTACT, SITE_NAME } from "../../lib/site";
import { isSelectableTemplate, TEMPLATES } from "../registry";
import { useInvitation } from "./InvitationContext";

/**
 * Har bir taklifnomaning eng pastidagi kichik imzo: mehmonlar ko'p so'raydi
 * "buni qanday yasayman?" — bu yerdan aynan shu shablon bilan yaratishga o'tadi.
 * Havolada ?ref=<slug>: qaysi taklifnoma qancha odam olib kelgani sanaladi.
 * Namunalarda ko'rsatilmaydi — u yerda o'z paneli bor (DemoBar).
 */
export function MadeWithBeluga() {
  const { data, mode } = useInvitation();
  if (mode === "demo") return null;

  const params = new URLSearchParams();
  if (isSelectableTemplate(data.template)) params.set("shablon", data.template);
  if (mode === "live" && data.slug) params.set("ref", data.slug);
  const background = TEMPLATES[data.template]?.palette[0] ?? "#faf6ef";

  return (
    <aside aria-label={`${SITE_NAME} haqida`} style={{ background }} className="relative z-[1] px-6 pb-28 pt-14 text-center font-sans">
      <span className="mx-auto block h-px w-16 bg-ink/15" aria-hidden="true" />
      <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-ink/55">
        Bu taklifnoma <b className="font-semibold text-ink/75">{SITE_NAME}</b>'da yaratilgan
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <a
          href={`${withBase("/yaratish")}?${params.toString()}`}
          target="_blank"
          rel="noopener"
          className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory transition-opacity hover:opacity-85"
        >
          Shunday taklifnoma yaratish →
        </a>
        <a
          href={`https://t.me/${PAYMENT_CONTACT}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-ink/70 ring-1 ring-ink/20 transition-colors hover:text-ink"
        >
          Buyurtma berish
        </a>
      </div>
    </aside>
  );
}
