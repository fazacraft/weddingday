import { useState } from "react";
import { WishCard } from "./WishCard";
import type { Wish } from "../shared/useWishes";

interface WishesMarqueeProps {
  wishes: Wish[];
}

/**
 * Tilaklarni cheksiz gorizontal karuselda aylantiradi. Kursor ustiga
 * kelganda (yoki fokus/teginish) aylanish to'xtaydi. Uzluksiz aylanma uchun
 * ro'yxat ikki marta chiziladi va trek -50% ga suriladi (index.css: @marquee).
 */
export function WishesMarquee({ wishes }: WishesMarqueeProps) {
  const [paused, setPaused] = useState(false);

  // Kam tilak bo'lsa aylantirmaymiz — markazda joylashtiramiz.
  if (wishes.length < 3) {
    return (
      <div className="flex flex-wrap justify-center gap-5">
        {wishes.map((wish) => (
          <div key={wish._id} className="w-[300px] max-w-full shrink-0">
            <WishCard
              name={wish.name}
              message={wish.message}
              createdAt={wish.createdAt}
              clamp
            />
          </div>
        ))}
      </div>
    );
  }

  // Har bir kartaga ~5s — ko'proq tilak bo'lsa sekinroq aylanadi.
  const duration = Math.max(wishes.length * 5, 20);
  const loop = [...wishes, ...wishes];

  return (
    <div
      className="marquee-mask overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <ul
        className="marquee-track flex w-max gap-5 py-2"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {loop.map((wish, i) => (
          <li
            key={`${wish._id}-${i}`}
            className="w-[300px] shrink-0"
            aria-hidden={i >= wishes.length}
          >
            <WishCard
              name={wish.name}
              message={wish.message}
              createdAt={wish.createdAt}
              clamp
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
