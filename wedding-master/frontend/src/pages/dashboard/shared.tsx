import { useState } from "react";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return y && m && d ? `${d}-${UZ_MONTHS[m - 1]}, ${y}` : date;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Toshkent sanasi bo'yicha to'ygacha qolgan kunlar (manfiy — o'tib ketgan). */
export function daysUntil(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  if (!y) return 0;
  const tashkentToday = new Date(Date.now() + 5 * 3_600_000);
  const today = Date.UTC(tashkentToday.getUTCFullYear(), tashkentToday.getUTCMonth(), tashkentToday.getUTCDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}

/** Havola faqat nashr qilingan yoki admin tasdiqlagan taklifnomada ko'rsatiladi. */
export function linkVisible(inv: { status: string; review?: string }): boolean {
  return inv.status === "published" || inv.review === "approved";
}

export function StatusBadge({ status, review }: { status: "draft" | "published"; review?: string }) {
  if (status !== "published" && review === "pending") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        To'lov kutilmoqda
      </span>
    );
  }
  if (status !== "published" && review === "rejected") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose">
        <span className="h-1.5 w-1.5 rounded-full bg-rose" />
        Rad etilgan
      </span>
    );
  }
  return status === "published" ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Nashrda
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/50">
      <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
      Qoralama
    </span>
  );
}

export function CopyButton({ text, label = "Nusxalash" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        })
      }
      className={`h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${
        copied ? "bg-emerald-600 text-white" : "bg-ink text-ivory hover:bg-ink/85"
      }`}
    >
      {copied ? "Nusxalandi ✓" : label}
    </button>
  );
}
