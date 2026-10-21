import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { DEMO_WISHES, type Wish } from "../../types/invitation";
import { useInvitation } from "./InvitationContext";

export type { Wish };

interface UseWishesReturn {
  wishes: Wish[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  submitWish: (name: string, message: string) => Promise<boolean>;
}

/**
 * Jonli sahifada tilaklar API'dan olinadi va Socket.io orqali real vaqtda
 * yangilanadi. Demo/preview rejimida namunaviy tilaklar ko'rsatiladi va yangi
 * tilak faqat brauzerda qo'shiladi (hech qayerga saqlanmaydi).
 */
export function useWishes(): UseWishesReturn {
  const { data, id, mode } = useInvitation();
  const live = mode === "live";
  const [wishes, setWishes] = useState<Wish[]>(live ? [] : DEMO_WISHES);
  const [loading, setLoading] = useState(live);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!live) return;
    api<Wish[]>(`/public/${data.slug}/wishes`)
      .then(setWishes)
      .catch(() => setError("Tilaklar yuklanmadi"))
      .finally(() => setLoading(false));
  }, [live, data.slug]);

  // Boshqa mehmonlar tilak qoldirganda real vaqtda qo'shamiz (Socket.io).
  useEffect(() => {
    if (!live || !id) return;
    const socket = getSocket();
    const join = () => socket.emit("join", id);
    const onWishCreated = (wish: Wish) => {
      setWishes((prev) =>
        prev.some((w) => w._id === wish._id) ? prev : [wish, ...prev]
      );
    };
    join();
    // Ulanish uzilib qayta tiklansa, xonaga qaytadan qo'shilamiz
    socket.on("connect", join);
    socket.on("wish:created", onWishCreated);
    return () => {
      socket.off("connect", join);
      socket.off("wish:created", onWishCreated);
    };
  }, [live, id]);

  const submitWish = useCallback(
    async (name: string, message: string): Promise<boolean> => {
      setError(null);
      if (!live) {
        setWishes((prev) => [
          { _id: `local-${Date.now()}`, name, message, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        return true;
      }
      setSubmitting(true);
      try {
        const newWish = await api<Wish>(`/public/${data.slug}/wishes`, {
          method: "POST",
          body: { name, message },
        });
        // Socket orqali ham shu tilak kelishi mumkin — takrorlanmasligi uchun
        // _id bo'yicha tekshiramiz.
        setWishes((prev) =>
          prev.some((w) => w._id === newWish._id) ? prev : [newWish, ...prev]
        );
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [live, data.slug]
  );

  return { wishes, loading, submitting, error, submitWish };
}
