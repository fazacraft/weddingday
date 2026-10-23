import { useEffect, useRef } from "react";
import { onPreviewSlotFocus, type PhotoSlot } from "../../lib/previewFocus";
import { useInvitation } from "./InvitationContext";

const FLASH_MS = 1800;
const SLOTS: PhotoSlot[] = ["cover", "couple", "venue", "gallery"];

/**
 * Faqat wizard'dagi jonli ko'rinishda: rasm maydoni tanlanganda kirish ekranini
 * chetlab o'tib (`open`), sahifani `[data-slot~="..."]` elementiga aylantiradi
 * (bir element bir nechta joyni bildirishi mumkin: data-slot="cover couple")
 * va uni bir lahza belgilaydi. Shablonda bunday joy bo'lmasa, hech narsa qilmaydi.
 *
 * Signal ikki yo'l bilan keladi: BroadcastChannel (desktop'dagi yonma-yon iframe)
 * yoki `?slot=` parametri (telefondagi to'liq ekranli ko'rinish ochilganda).
 */
export function useSlotFocus(open: () => void) {
  const { mode } = useInvitation();
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (mode !== "preview") return;
    let timer = 0;
    const focus = (slot: PhotoSlot) => {
      openRef.current();
      window.clearTimeout(timer);
      // Kirish ekrani yopilib, bo'limlar chizilishini kutamiz
      timer = window.setTimeout(() => {
        const target = document.querySelector<HTMLElement>(`[data-slot~="${slot}"]`);
        if (!target) return;
        // scrollIntoView iframe'ni o'z ichiga olgan wizard sahifasini ham aylantirib
        // yuboradi — shuning uchun faqat shu oyna ichida aylantiramiz
        const rect = target.getBoundingClientRect();
        const top = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2);
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        target.classList.remove("slot-flash");
        void target.offsetWidth;
        target.classList.add("slot-flash");
        window.setTimeout(() => target.classList.remove("slot-flash"), FLASH_MS);
      }, 150);
    };

    const initial = new URLSearchParams(window.location.search).get("slot") as PhotoSlot | null;
    if (initial && SLOTS.includes(initial)) focus(initial);

    const unsubscribe = onPreviewSlotFocus(focus);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [mode]);
}
