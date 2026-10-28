import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { api, mediaUrl, PHOTO_WIDTHS } from "../lib/api";
import { TEMPLATES, isTemplateKey } from "../templates/registry";
import { TemplateThumb } from "./TemplateThumb";

/** Admin "namuna" qilib belgilagan, nashrdagi taklifnoma (GET /api/showcase). */
export interface ShowcaseItem {
  slug: string;
  template: string;
  groomName: string;
  brideName: string;
  eventTitle: string;
  date: string;
  venueName: string;
  photo: string;
}

interface ShowcasePage {
  total: number;
  page: number;
  pageSize: number;
  items: ShowcaseItem[];
}

/** "Yana ko'rsatish" bilan sahifalab yuklash. loaded=false — birinchi sahifa hali kelmagan. */
export function useShowcase(pageSize: number) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        const data = await api<ShowcasePage>(`/showcase?page=${nextPage}&limit=${pageSize}`, { token: "" });
        setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
        setTotal(data.total);
        setPage(nextPage);
      } catch {
        /* Ko'rgazma ixtiyoriy — xato bo'lsa bo'lim ko'rsatilmaydi */
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return { items, total, loaded, loading, hasMore: items.length < total, loadMore: () => void load(page + 1) };
}

const THUMB_WIDTH = 300;
const THUMB_HEIGHT = 400;

/**
 * Shablon miniatyurasi kattaroq kartochka uchun chizilgan (shrift va o'lchamlar
 * px'da). Tor kartochkada (telefonda 2 ustun) siqilib, matnlar ustma-ust tushadi —
 * shuning uchun doim 300×400 da chizib, kartochka kengligiga proporsional kichraytiramiz.
 */
function ScaledThumb({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / THUMB_WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="origin-top-left" style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** "2026-12-19" → "19.12.2026" */
function shortDate(date: string): string {
  return date ? date.split("-").reverse().join(".") : "";
}

export function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const template = isTemplateKey(item.template) ? TEMPLATES[item.template] : null;
  return (
    <Link
      // ?namuna — ko'rgazmadan ochilganda ochilishlar sanalmaydi va tilak/javob saqlanmaydi
      to={`/${item.slug}?namuna=1`}
      target="_blank"
      rel="noopener"
      className="group block overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white transition-shadow hover:shadow-[0_24px_50px_-30px_rgba(31,26,23,0.5)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        {item.photo ? (
          <img
            src={mediaUrl(item.photo, PHOTO_WIDTHS.thumb)}
            alt={`${item.groomName} va ${item.brideName}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : template ? (
          <ScaledThumb>
            <TemplateThumb
              template={template.key}
              groom={item.groomName}
              bride={item.brideName}
              date={shortDate(item.date)}
              className="h-full w-full"
            />
          </ScaledThumb>
        ) : null}
        {template && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink/70 backdrop-blur">
            {template.name}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <p className="line-clamp-2 font-display text-lg font-semibold leading-tight text-ink sm:text-2xl">
          {item.groomName} <span className="text-rose">&</span> {item.brideName}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink/50">
          {item.eventTitle}
          {item.date && ` · ${shortDate(item.date)}`}
        </p>
        <p className="mt-3 text-xs font-semibold text-rose">Ochib ko'rish ↗</p>
      </div>
    </Link>
  );
}

export function ShowcaseGrid({ items }: { items: ShowcaseItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {items.map((item) => (
        <ShowcaseCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
