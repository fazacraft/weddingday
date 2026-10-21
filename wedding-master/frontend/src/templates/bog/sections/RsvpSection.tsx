import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "../../../components/ui/Container";
import { SectionWrapper } from "../../../components/ui/SectionWrapper";
import { FadeUp } from "../../../components/ui/FadeUp";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { OrnamentDivider } from "../Ornament";
import { useRsvp } from "../../shared/useRsvp";
import { useInvitation } from "../../shared/InvitationContext";
import { useLang } from "../../../context/LanguageContext";

export function RsvpSection() {
  const { t } = useLang();
  const { guestName } = useInvitation();
  const { submit, submitting, error, sent, reset } = useRsvp();
  const [name, setName] = useState(guestName);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState(1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (attending === null) return;
    void submit({ name: name.trim(), attending, guests });
  };

  return (
    <SectionWrapper id="rsvp" label={t("Javobingiz")} className="bg-cream">
      <Container>
        <FadeUp>
          <h2 className="font-script text-5xl md:text-6xl text-forest text-center mb-2">
            {t("Kelasizmi?")}
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="font-body text-sm text-center text-charcoal/60 mb-2">
            {t("Tayyorgarlik ko'rishimiz uchun javobingizni bildiring")}
          </p>
        </FadeUp>
        <FadeUp delay={0.2}>
          <OrnamentDivider />
        </FadeUp>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              className="max-w-md mx-auto mt-8 text-center bg-white rounded-2xl px-6 py-8 shadow-md border border-forest/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-script text-4xl text-forest mb-2">{t("Rahmat!")}</p>
              <p className="font-body text-sm text-charcoal/70">
                {sent.attending
                  ? t("Sizni intiqlik bilan kutamiz.")
                  : t("Afsus! Duolaringiz biz bilan bo'lsin.")}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 font-body text-xs tracking-[0.2em] uppercase text-forest/60 hover:text-forest"
              >
                {t("Javobni o'zgartirish")}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="max-w-md mx-auto mt-8 flex flex-col gap-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              exit={{ opacity: 0 }}
            >
              <Input
                id="rsvp-name"
                label={t("Ismingiz")}
                placeholder={t("Ism Familiya")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true, label: "Albatta kelaman" },
                  { value: false, label: "Kela olmayman" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    aria-pressed={attending === opt.value}
                    onClick={() => setAttending(opt.value)}
                    className={`rounded-xl border px-3 py-3 font-formal text-lg transition-colors ${
                      attending === opt.value
                        ? "bg-forest text-cream border-forest"
                        : "bg-white text-forest border-forest/30 hover:border-forest"
                    }`}
                  >
                    {t(opt.label)}
                  </button>
                ))}
              </div>

              {attending && (
                <label className="flex items-center justify-between gap-4 font-body text-sm text-charcoal/80">
                  {t("Necha kishi bo'lasiz?")}
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="bg-white border border-forest/30 rounded px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {error && <p className="text-sm text-red-600 font-body text-center">{t(error)}</p>}

              <div className="flex justify-center">
                <Button type="submit" disabled={submitting || attending === null || !name.trim()}>
                  {submitting ? t("Yuborilmoqda...") : t("Javob yuborish")}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Container>
    </SectionWrapper>
  );
}
