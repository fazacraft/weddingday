import { RefObject, useEffect } from "react";

const MAX_WAIT_MS = 4000;

/** Sahifadagi lazy bo'lmagan, hali yuklanmagan rasmlar tugashini kutadi (ko'pi bilan MAX_WAIT_MS). */
function eagerImagesLoaded(): Promise<unknown> {
  const pending = Array.from(document.images).filter((img) => img.loading !== "lazy" && !img.complete);
  const loaded = Promise.all(
    pending.map(
      (img) =>
        new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
    )
  );
  return Promise.race([loaded, new Promise((resolve) => window.setTimeout(resolve, MAX_WAIT_MS))]);
}

/**
 * Musiqa (0.6–6 MB) sahifa ochilishi bilan yuklansa, hero rasm bilan tarmoqni
 * talashadi va birinchi ekran sekin chiqadi. Shuning uchun <audio> preload="none"
 * bilan boshlanadi va ko'rinib turgan rasmlar yuklangach fonda yuklana boshlaydi —
 * mehmon konvertni ochguncha odatda tayyor bo'ladi. Undan oldin ochsa, play()
 * baribir yuklab chaladi.
 */
export function useDeferredAudioPreload(audioRef: RefObject<HTMLAudioElement | null>) {
  useEffect(() => {
    let cancelled = false;
    // Shablon rasmlari DOM'ga tushishi uchun bir lahza kutamiz
    const timer = window.setTimeout(() => {
      void eagerImagesLoaded().then(() => {
        const audio = audioRef.current;
        if (cancelled || !audio || !audio.paused || audio.readyState > 0) return;
        audio.preload = "auto";
        audio.load();
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [audioRef]);
}
