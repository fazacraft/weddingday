import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { mediaUrl, PHOTO_WIDTHS } from "../../lib/api";
import { useInvitation } from "./InvitationContext";
import "./gallery.css";

export interface GalleryPhoto {
  thumb: string;
  full: string;
}

/**
 * Rasmlar to'ri; bosilgan rasm butun ekranda ochiladi (strelkalar va Esc bilan).
 * Ko'rinish `body`'ga chiziladi: shablon bo'limlaridagi transform (.reveal)
 * position: fixed'ni buzmasin. Rangi va burchagi --gallery-* o'zgaruvchilaridan.
 */
export function PhotoGallery({ photos, itemClassName = "" }: { photos: GalleryPhoto[]; itemClassName?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <>
      <div className={`inv-gallery${photos.length % 2 ? " inv-gallery--odd" : ""}`} data-slot="gallery">
        {photos.map((photo, i) => (
          <button key={`${photo.thumb}-${i}`} type="button" className={`inv-gallery-item ${itemClassName}`} onClick={() => setOpen(i)}>
            <img src={photo.thumb} alt={`${i + 1}-rasm`} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {open !== null &&
        createPortal(
          <div className="inv-lightbox" role="dialog" aria-modal="true" aria-label="Rasm" onClick={() => setOpen(null)}>
            <img src={photos[open].full} alt={`${open + 1}-rasm`} onClick={(e) => e.stopPropagation()} />
            <button type="button" className="inv-lightbox-close" aria-label="Yopish" onClick={() => setOpen(null)}>×</button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="inv-lightbox-nav inv-lightbox-nav--prev"
                  aria-label="Oldingi rasm"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="inv-lightbox-nav inv-lightbox-nav--next"
                  aria-label="Keyingi rasm"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/** Taklifnomaga yuklangan galereya rasmlari (namunasiz): bo'lmasa — bo'sh ro'yxat. */
export function useGalleryPhotos(): GalleryPhoto[] {
  const { data } = useInvitation();
  return useMemo(
    () => (data.gallery ?? []).map((src) => ({ thumb: mediaUrl(src, PHOTO_WIDTHS.thumb), full: mediaUrl(src, PHOTO_WIDTHS.hero) })),
    [data.gallery]
  );
}
