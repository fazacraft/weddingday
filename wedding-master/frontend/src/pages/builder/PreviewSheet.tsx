import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { withBase } from "../../lib/base";
import { focusPreviewSlot, type PhotoSlot } from "../../lib/previewFocus";

/*
 * Jonli ko'rinishni ochish. Katta ekranda u yonda doim turadi — faqat kerakli
 * joyga aylantiramiz. Telefonda esa wizard ichida butun ekranli oyna ochiladi;
 * holati URL'dagi #korinish bilan boshqariladi, shuning uchun telefonning
 * "orqaga" tugmasi uni yopadi (yangi tab ochilmaydi).
 */

const HASH = "#korinish";
const DESKTOP = "(min-width: 1024px)";

interface PreviewApi {
  show: (slot?: PhotoSlot) => void;
}

const PreviewContext = createContext<PreviewApi>({ show: (slot) => slot && focusPreviewSlot(slot) });

export function usePreview(): PreviewApi {
  return useContext(PreviewContext);
}

/**
 * Yondagi doimiy ko'rinish faqat katta ekranda kerak. CSS bilan yashirilgan
 * iframe ham butun taklifnomani (rasm, shrift, shablon kodi) yuklaydi —
 * telefonda buni umuman chizmaymiz.
 */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const onChange = () => setDesktop(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

export function PreviewProvider({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const open = location.hash === HASH;
  const state = location.state as { slot?: PhotoSlot; fromWizard?: boolean } | null;
  const slot = state?.slot;
  const fromWizard = Boolean(state?.fromWizard);

  const show = useCallback(
    (target?: PhotoSlot) => {
      if (window.matchMedia(DESKTOP).matches) {
        if (target) focusPreviewSlot(target);
        return;
      }
      navigate({ search: location.search, hash: HASH }, { state: { slot: target, fromWizard: true } });
    },
    [navigate, location.search]
  );

  const close = useCallback(() => {
    // Wizard ichidan ochilgan bo'lsa — "orqaga" bilan bir xil; sahifa to'g'ridan-to'g'ri
    // #korinish bilan ochilgan bo'lsa, wizard'dan chiqib ketmaslik uchun faqat hash'ni olib tashlaymiz
    if (fromWizard) navigate(-1);
    else navigate({ search: location.search, hash: "" }, { replace: true });
  }, [navigate, location.search, fromWizard]);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <PreviewContext.Provider value={api}>
      {children}
      {open && <PreviewSheet storageKey={storageKey} slot={slot} onClose={close} />}
    </PreviewContext.Provider>
  );
}

function PreviewSheet({ storageKey, slot, onClose }: { storageKey: string; slot?: PhotoSlot; onClose: () => void }) {
  // Ochiq turganda orqadagi wizard aylanmasin
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const params = new URLSearchParams({ key: storageKey });
  if (slot) params.set("slot", slot);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink" role="dialog" aria-modal="true" aria-label="Jonli ko'rinish">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ivory">Jonli ko'rinish</p>
          <p className="truncate text-[11px] text-ivory/50">Mehmon taklifnomani aynan shunday ko'radi</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-10 shrink-0 rounded-full bg-ivory px-4 text-sm font-semibold text-ink active:scale-95"
        >
          ← Tahrirga qaytish
        </button>
      </div>
      <iframe
        title="Taklifnoma ko'rinishi"
        src={`${withBase("/korinish")}?${params.toString()}`}
        className="w-full flex-1 rounded-t-2xl border-0 bg-ivory"
      />
    </div>
  );
}

/** Telefonda doim ko'rinib turadigan "Ko'rish" tugmasi. */
export function PreviewFab() {
  const { show } = usePreview();
  return (
    <button
      type="button"
      onClick={() => show()}
      className="fixed bottom-5 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-sm font-semibold text-ivory shadow-[0_14px_30px_-10px_rgba(31,26,23,0.7)] active:scale-95 lg:hidden"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      Ko'rish
    </button>
  );
}
