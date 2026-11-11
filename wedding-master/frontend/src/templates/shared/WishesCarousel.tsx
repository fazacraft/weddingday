import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Wish } from "./useWishes";
import "./wishes.css";

/** Aylanish tezligi, px/soniya */
const SPEED = 28;
/** Mehmon surib qo'yganidan keyin aylanish shuncha vaqtdan so'ng davom etadi */
const RESUME_MS = 2500;

interface WishesCarouselProps {
  wishes: Wish[];
  /** Kartaning ichi: ism, matn va shablonga xos bezaklar (.wish-name, .wish-text) */
  children: (wish: Wish) => ReactNode;
}

/**
 * Tilaklarni gorizontal karuselda sekin aylantiradi. Barmoq bilan surish
 * mumkin, kursor ustida yoki karta ochilganda to'xtaydi. Uzun tilak qisqartirib
 * ko'rsatiladi — kartani bosganda to'liq ochiladi. Hammasi sig'sa, aylanmaydi.
 */
export function WishesCarousel({ wishes, children }: WishesCarouselProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [loop, setLoop] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const hold = useRef({ hover: false, focus: false, touch: false, open: false, until: 0 });
  hold.current.open = openId !== null;

  // Bitta nusxa sig'masa — aylanadigan rejim: ro'yxat ikki marta chiziladi,
  // birinchi nusxa oxiriga yetganda sezdirmasdan boshiga qaytiladi.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!box || !track) return;
    const measure = () => {
      const single = loop ? track.scrollWidth / 2 : track.scrollWidth;
      setLoop(wishes.length > 1 && single > box.clientWidth + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(track);
    return () => ro.disconnect();
  }, [wishes, loop]);

  useEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!loop || !box || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(box);

    let pos = box.scrollLeft;
    let last = performance.now();
    let raf = 0;

    // Mehmon o'zi sursa (barmoq, g'ildirak) — biroz kutib, o'sha joydan davom etamiz
    const onScroll = () => {
      if (Math.abs(box.scrollLeft - pos) <= 2) return;
      hold.current.until = performance.now() + RESUME_MS;
      const half = track.scrollWidth / 2;
      if (box.scrollLeft >= half) box.scrollLeft -= half;
      pos = box.scrollLeft;
    };
    const onTouchStart = () => {
      hold.current.touch = true;
    };
    const onTouchEnd = () => {
      hold.current.touch = false;
      hold.current.until = performance.now() + RESUME_MS;
    };
    box.addEventListener("scroll", onScroll, { passive: true });
    box.addEventListener("touchstart", onTouchStart, { passive: true });
    box.addEventListener("touchend", onTouchEnd, { passive: true });
    box.addEventListener("touchcancel", onTouchEnd, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const h = hold.current;
      if (visible && !h.hover && !h.focus && !h.touch && !h.open && now >= h.until) {
        pos += (SPEED * dt) / 1000;
        const half = track.scrollWidth / 2;
        if (pos >= half) pos -= half;
        box.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      box.removeEventListener("scroll", onScroll);
      box.removeEventListener("touchstart", onTouchStart);
      box.removeEventListener("touchend", onTouchEnd);
      box.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [loop]);

  // O'chirilgan/yashirilgan tilak ochiq turgan bo'lsa — karusel qotib qolmasin
  useEffect(() => {
    if (openId && !wishes.some((w) => w._id === openId)) setOpenId(null);
  }, [wishes, openId]);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    }
  };

  const copies = loop ? [0, 1] : [0];
  return (
    <div
      ref={boxRef}
      className={`wish-carousel${loop ? " is-looping" : ""}`}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hold.current.hover = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") hold.current.hover = false;
      }}
      onFocus={(e) => {
        // Faqat klaviatura fokusi: telefonda kartaga tegish fokus beradi, lekin
        // aylanish to'xtab qolmasligi kerak
        hold.current.focus = e.target.matches(":focus-visible");
      }}
      onBlur={() => {
        hold.current.focus = false;
      }}
    >
      <ul ref={trackRef} className={`wish-track${openId ? " has-open" : ""}`}>
        {copies.flatMap((copy) =>
          wishes.map((wish) => (
            <li
              key={`${copy}-${wish._id}`}
              className={`wish-item wish-slide${openId === wish._id ? " is-open" : ""}`}
              aria-hidden={copy === 1 ? true : undefined}
              tabIndex={copy === 1 ? -1 : 0}
              onClick={() => toggle(wish._id)}
              onKeyDown={(e) => onKey(e, wish._id)}
            >
              {children(wish)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
