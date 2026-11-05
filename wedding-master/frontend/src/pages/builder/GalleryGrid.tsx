import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { mediaUrl, PHOTO_WIDTHS } from "../../lib/api";

function moved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Bir xil fayl ikki marta qo'shilgan bo'lsa ham kalitlar takrorlanmasin. */
function uniqueKeys(urls: string[]): string[] {
  const seen = new Map<string, number>();
  return urls.map((url) => {
    const n = seen.get(url) ?? 0;
    seen.set(url, n + 1);
    return `${url}#${n}`;
  });
}

const DRAG_THRESHOLD = 5;
const CONTROL = "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/70 text-sm text-white hover:bg-ink disabled:opacity-30";

const GRIP = (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
    {[3, 8, 13].flatMap((y) => [6, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
  </svg>
);

/**
 * Galereya rasmlari, tartibini o'zgartirish bilan. Sichqoncha bilan rasmning
 * istalgan joyidan, telefonda tutqichdan (⠿) ushlab suriladi — butun rasm
 * ushlansa, ustidan sahifani aylantirib bo'lmay qolardi. ‹ › tugmalari bir bosishda
 * bir qadam suradi (klaviatura uchun ham).
 *
 * Surish davomida DOM tartibi o'zgarmaydi, faqat transform: element ko'chirilsa
 * telefonda barmoq bilan aloqa uzilib qoladi. Natija qo'yib yuborilganda yoziladi.
 */
export function GalleryGrid({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const rectsRef = useRef<DOMRect[]>([]);
  const stopRef = useRef<(() => void) | null>(null);
  // Surish davomida yuklash tugasa, yangi rasm yo'qolmasin
  const latest = useRef(value);
  latest.current = value;
  const [drag, setDrag] = useState<{ from: number; to: number; dx: number; dy: number } | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  const startDrag = (e: ReactPointerEvent, from: number) => {
    if (e.button !== 0 || value.length < 2 || stopRef.current) return;
    e.preventDefault();
    const { clientX: startX, clientY: startY, pointerId } = e;
    const rects = Array.from(gridRef.current?.children ?? []).map((el) => el.getBoundingClientRect());
    rectsRef.current = rects;
    let to = from;
    let active = false;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!active && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      active = true;
      // Barmoq/kursorga eng yaqin katak
      let best = Infinity;
      rects.forEach((rect, i) => {
        const distance = Math.hypot(ev.clientX - (rect.left + rect.width / 2), ev.clientY - (rect.top + rect.height / 2));
        if (distance < best) {
          best = distance;
          to = i;
        }
      });
      setDrag({ from, to, dx, dy });
    };
    const finish = (commit: boolean) => {
      stop();
      setDrag(null);
      if (commit && active && to !== from) onChange(moved(latest.current, from, to));
    };
    const onUp = (ev: PointerEvent) => ev.pointerId === pointerId && finish(true);
    const onCancel = (ev: PointerEvent) => ev.pointerId === pointerId && finish(false);
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && finish(false);
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      stopRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    stopRef.current = stop;
  };

  /** Surish paytida har bir rasm qaysi katakda ko'rinadi. */
  const slotOf = (i: number): number => {
    if (!drag) return i;
    if (i === drag.from) return drag.to;
    if (drag.from < i && i <= drag.to) return i - 1;
    if (drag.to <= i && i < drag.from) return i + 1;
    return i;
  };

  const keys = uniqueKeys(value);

  return (
    <div ref={gridRef} className="mt-4 grid select-none grid-cols-3 gap-2 sm:grid-cols-4">
      {value.map((url, i) => {
        const lifted = drag?.from === i;
        const slot = slotOf(i);
        const rects = rectsRef.current;
        const transform = lifted
          ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.04)`
          : drag && slot !== i
            ? `translate(${rects[slot].left - rects[i].left}px, ${rects[slot].top - rects[i].top}px)`
            : undefined;
        return (
          <div
            key={keys[i]}
            data-gallery-photo
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && !(e.target as HTMLElement).closest("button")) startDrag(e, i);
            }}
            style={{ transform }}
            className={`relative aspect-[3/4] overflow-hidden rounded-xl bg-sand ${value.length > 1 ? "cursor-grab" : ""} ${
              lifted ? "z-20 cursor-grabbing shadow-[0_18px_40px_-14px_rgba(31,26,23,0.6)]" : drag ? "transition-transform duration-200" : ""
            }`}
          >
            <img src={mediaUrl(url, PHOTO_WIDTHS.thumb)} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
            {value.length > 1 && (
              <span className="absolute left-1.5 top-1.5 grid h-7 min-w-7 place-items-center rounded-full bg-white/90 px-1.5 text-xs font-bold text-ink">
                {slot + 1}
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className={`absolute right-1.5 top-1.5 ${CONTROL}`}
              aria-label={`${i + 1}-rasmni o'chirish`}
            >
              ×
            </button>
            {value.length > 1 && (
              <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => onChange(moved(value, i, i - 1))}
                  className={CONTROL}
                  aria-label={`${i + 1}-rasmni oldinga surish`}
                >
                  ‹
                </button>
                <span
                  data-gallery-handle
                  onPointerDown={(e) => {
                    if (e.pointerType !== "mouse") startDrag(e, i);
                  }}
                  aria-hidden="true"
                  className="grid h-7 min-w-0 flex-1 touch-none place-items-center rounded-full bg-ink/70 text-white"
                >
                  {GRIP}
                </span>
                <button
                  type="button"
                  disabled={i === value.length - 1}
                  onClick={() => onChange(moved(value, i, i + 1))}
                  className={CONTROL}
                  aria-label={`${i + 1}-rasmni keyinga surish`}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
