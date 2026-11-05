import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RELOADED_AT_KEY = "fz-chunk-reload";
/** Shu vaqt ichida ikkinchi marta qayta yuklanmaydi — fayl haqiqatan yo'q bo'lsa, cheksiz aylanmasin */
const RELOAD_GUARD_MS = 30_000;

function reloadOnce(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
    if (Date.now() - last < RELOAD_GUARD_MS) return false;
    window.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * React.lazy + yangi deploy'dan himoya. Sayt yangilanganda eski kod fayllari
 * o'chadi: oldin ochilgan sahifa keyingi bo'limni yuklay olmay, butunlay oq
 * bo'lib qolardi. Endi sahifa bir marta o'zi yangilanadi va yangi kodni oladi;
 * bu ham yordam bermasa, xato ErrorBoundary'ga o'tadi.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React.lazy'ning o'zidagi cheklov
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>): LazyExoticComponent<T> {
  return lazy(() =>
    load().catch((err: unknown): Promise<{ default: T }> => {
      // Sahifa qayta yuklanguncha shu holatda kutadi
      if (reloadOnce()) return new Promise(() => {});
      throw err;
    })
  );
}
