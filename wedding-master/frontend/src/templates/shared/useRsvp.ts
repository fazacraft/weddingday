import { useCallback, useState } from "react";
import { api, ApiError, API_URL } from "../../lib/api";
import { useInvitation } from "./InvitationContext";

export interface RsvpInput {
  name: string;
  attending: boolean;
  guests: number;
}

/** Mehmonning "kelaman / kela olmayman" javobini yuboradi. */
export function useRsvp() {
  const { data, mode } = useInvitation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<RsvpInput | null>(null);

  const submit = useCallback(
    async (input: RsvpInput) => {
      setError(null);
      if (mode !== "live") {
        setSent(input);
        return;
      }
      setSubmitting(true);
      try {
        await api(`/public/${data.slug}/rsvp`, { method: "POST", body: input });
        setSent(input);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
      } finally {
        setSubmitting(false);
      }
    },
    [mode, data.slug]
  );

  return { submit, submitting, error, sent, reset: () => setSent(null) };
}

/** Konvert/kirish tugmasi bosilganda ochilishlar sonini oshiradi (faqat jonli sahifada). */
export function useCountOpen() {
  const { data, mode } = useInvitation();
  return useCallback(() => {
    if (mode !== "live") return;
    fetch(`${API_URL}/api/public/${data.slug}/open`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [mode, data.slug]);
}
