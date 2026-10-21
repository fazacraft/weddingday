import { useEffect, useId, useState } from "react";
import { api } from "../../lib/api";
import { SLUG_RE } from "../../lib/site";

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

interface Props {
  value: string;
  onChange: (slug: string) => void;
  /** Tahrirlashda o'z taklifnomasining joriy manzili "band" deb chiqmasligi uchun. */
  exceptId?: string;
  onStatus: (status: SlugStatus) => void;
  serverError?: string;
}

export function SlugField({ value, onChange, exceptId, onStatus, serverError }: Props) {
  const id = useId();
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setStatus("idle");
      return;
    }
    if (!SLUG_RE.test(value)) {
      setStatus("invalid");
      setReason("3–60 belgi: a–z, 0–9 va chiziqcha (-). Boshi va oxiri harf yoki raqam.");
      return;
    }
    setStatus("checking");
    const timer = window.setTimeout(() => {
      const q = exceptId ? `?except=${exceptId}` : "";
      api<{ available: boolean; reason: string | null }>(`/invitations/slug/${value}${q}`)
        .then((res) => {
          setStatus(res.available ? "available" : "taken");
          setReason(res.reason);
        })
        .catch(() => {
          setStatus("error");
          setReason("Tekshirib bo'lmadi — serverga ulanishni tekshiring");
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [value, exceptId]);

  useEffect(() => onStatus(status), [status, onStatus]);

  const badge = {
    idle: null,
    checking: <span className="text-ink/40">tekshirilmoqda…</span>,
    available: <span className="text-emerald-700">✓ bo'sh</span>,
    taken: <span className="text-rose">band</span>,
    invalid: <span className="text-rose">noto'g'ri</span>,
    error: <span className="text-rose">xato</span>,
  }[status];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink/80">
        Taklifnoma havolasi
      </label>
      <div
        className={`flex h-14 items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-4 focus-within:ring-rose/10 ${
          status === "taken" || status === "invalid" || serverError ? "border-rose" : "border-ink/15 focus-within:border-rose/60"
        }`}
      >
        <span className="flex h-full items-center border-r border-ink/10 bg-sand/60 px-3 font-mono text-[13px] text-ink/50">
          {window.location.host}/
        </span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-"))}
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-[15px] font-semibold text-ink focus:outline-none"
          placeholder="dilnoza-bekzod"
          maxLength={60}
          spellCheck={false}
          autoCapitalize="off"
        />
        <span className="pr-4 text-xs font-semibold">{badge}</span>
      </div>
      <p className={`text-xs ${status === "taken" || status === "invalid" || serverError ? "text-rose" : "text-ink/50"}`}>
        {serverError ??
          (status === "taken" || status === "invalid" || status === "error"
            ? reason
            : "Qisqa va eslab qolinadigan bo'lsin. Mehmonlar aynan shu havolani ochadi.")}
      </p>
    </div>
  );
}
