import { useEffect, useState } from "react";
import { withBase } from "./base";

declare const __BUILD_ID__: string;

const CHECK_EVERY_MS = 5 * 60_000;
const PLATFORM_PATHS = ["/yaratish", "/kabinet", "/admin", "/namunalar", "/kirish", "/royxatdan-otish"];

/** Platforma sahifasimi — mehmonning taklifnomasi emas (u bezovta qilinmaydi). */
export function isPlatformPath(pathname: string): boolean {
  const path = pathname.replace(withBase("/").replace(/\/$/, ""), "") || "/";
  return path === "/" || PLATFORM_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Server yangi versiyada ekanini aniqlaydi: oynaga qaytganda va har 5 daqiqada tekshiradi. */
export function useNewBuild(enabled: boolean): boolean {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!enabled || stale) return;
    const check = () => {
      if (document.hidden) return;
      fetch(withBase("/version.json"), { cache: "no-cache" })
        .then((res) => (res.ok ? (res.json() as Promise<{ build?: string }>) : null))
        .then((data) => {
          if (data?.build && data.build !== __BUILD_ID__) setStale(true);
        })
        // Lokal Vite'da fayl yo'q (HTML qaytadi), tarmoq xatosi ham muhim emas
        .catch(() => {});
    };
    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [enabled, stale]);
  return stale;
}
