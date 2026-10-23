/*
 * Wizard → jonli ko'rinish (iframe) signali: "shu rasm joyini ko'rsat".
 * Iframe bir xil domenda, shuning uchun BroadcastChannel yetarli; qo'llamaydigan
 * brauzerlarda jim o'tib ketadi.
 */

export type PhotoSlot = "cover" | "couple" | "venue" | "gallery";

const CHANNEL = "fz-preview-focus";

export function focusPreviewSlot(slot: PhotoSlot): void {
  if (!("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ slot });
  channel.close();
}

/** Signal kelganda chaqiriladi; obunani bekor qiluvchi funksiyani qaytaradi. */
export function onPreviewSlotFocus(handler: (slot: PhotoSlot) => void): () => void {
  if (!("BroadcastChannel" in window)) return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e: MessageEvent<{ slot?: PhotoSlot }>) => {
    if (e.data?.slot) handler(e.data.slot);
  };
  return () => channel.close();
}
