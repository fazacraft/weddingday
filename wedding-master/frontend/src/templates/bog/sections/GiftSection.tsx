import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "../../../components/ui/Container";
import { SectionWrapper } from "../../../components/ui/SectionWrapper";
import { FadeUp } from "../../../components/ui/FadeUp";
import { OrnamentDivider } from "../Ornament";
import { useInvitation } from "../../shared/InvitationContext";
import { useLang } from "../../../context/LanguageContext";

export function GiftSection() {
  const { t } = useLang();
  const { data: wedding } = useInvitation();
  const [copied, setCopied] = useState(false);

  const rawNumber = wedding.cardNumber.replace(/\s/g, "");
  const formatted = rawNumber.replace(/(.{4})/g, "$1 ").trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(rawNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <SectionWrapper id="gift" label={t("To'yona")} className="bg-cream">
      <Container>
        <FadeUp>
          <h2 className="font-script text-5xl md:text-6xl text-forest text-center mb-2">
            {t("To'yona")}
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="font-body text-sm text-center text-charcoal/60 mb-2">
            {t("Eng samimiy tilaklar bilan birga ko'rsatgan e'tiboringiz uchun minnatdormiz")}
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <OrnamentDivider />
        </FadeUp>

        {/* Card */}
        <motion.div
          className="max-w-sm mx-auto mt-10"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        >
          {/* Bank card */}
          <motion.div
            className="relative w-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer select-none"
            style={{ aspectRatio: "1.586 / 1" }}
            whileHover={{ scale: 1.025, rotateY: 3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={handleCopy}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-forest via-[#3d5222] to-[#1e2d10]" />

            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute top-6 -right-4 w-32 h-32 rounded-full bg-white/[0.04]" />

            {/* Floral pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <FloralOverlay />
            </div>

            {/* Card content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-7">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="font-script text-white/50 text-base leading-none">
                    {t(wedding.groomName)}
                  </p>
                  <p className="font-script text-white/50 text-base leading-none">
                    &amp;
                  </p>
                  <p className="font-script text-white/50 text-base leading-none">
                    {t(wedding.brideName)}
                  </p>
                </div>
                <ChipIcon />
              </div>

              {/* Card number */}
              <div>
                <p className="font-mono text-white/40 text-[10px] tracking-[0.2em] uppercase mb-1">
                  {t("Karta raqami")}
                </p>
                <p className="font-mono text-white text-xl md:text-2xl tracking-[0.18em] font-medium">
                  {formatted}
                </p>
              </div>

              {/* Bottom row */}
              <div className="flex items-end justify-between">
                {wedding.cardHolder && (
                  <div>
                    <p className="font-mono text-white/40 text-[9px] tracking-[0.18em] uppercase mb-0.5">
                      {t("Karta egasi")}
                    </p>
                    <p className="font-mono text-white text-sm tracking-widest uppercase">
                      {t(wedding.cardHolder)}
                    </p>
                  </div>
                )}
                <div className="ml-auto">
                  <HeartIcon />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Copy button */}
          <motion.button
            onClick={handleCopy}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-forest/25 font-body text-sm text-forest/70 hover:bg-forest/5 hover:border-forest/50 hover:text-forest transition-all"
            whileTap={{ scale: 0.97 }}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="copied"
                  className="flex items-center gap-2 text-forest font-bold"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckIcon className="w-4 h-4" />
                  {t("Karta raqami nusxalandi!")}
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <CopyIcon className="w-4 h-4" />
                  {t("Raqamni nusxalash")}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <p className="mt-4 text-center font-body text-xs text-charcoal/35">
            {t("Kartaga bosish yoki tugmani bosib nusxalashingiz mumkin")}
          </p>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
}

/* ── Icons & decorative SVGs ─────────────────────────────────────────────── */

function ChipIcon() {
  return (
    <svg
      width="40"
      height="30"
      viewBox="0 0 40 30"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="38" height="28" rx="5" fill="#c8a84b" opacity="0.9" />
      <rect x="1" y="1" width="38" height="28" rx="5" stroke="#a07830" strokeWidth="0.8" />
      <line x1="13" y1="1" x2="13" y2="29" stroke="#a07830" strokeWidth="0.8" />
      <line x1="27" y1="1" x2="27" y2="29" stroke="#a07830" strokeWidth="0.8" />
      <line x1="1" y1="10" x2="39" y2="10" stroke="#a07830" strokeWidth="0.8" />
      <line x1="1" y1="20" x2="39" y2="20" stroke="#a07830" strokeWidth="0.8" />
      <rect x="13" y="10" width="14" height="10" fill="#b8922a" opacity="0.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path
        d="M18 30s-13-8.5-13-17A8 8 0 0118 8a8 8 0 0113 5c0 8.5-13 17-13 17z"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      <path
        d="M18 27s-10-6.5-10-13A6 6 0 0118 10a6 6 0 0110 4c0 6.5-10 13-10 13z"
        fill="rgba(255,255,255,0.12)"
      />
    </svg>
  );
}

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FloralOverlay() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 252" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="370" cy="30" r="60" stroke="white" strokeWidth="1" fill="none" />
      <circle cx="370" cy="30" r="40" stroke="white" strokeWidth="0.8" fill="none" />
      <circle cx="30" cy="222" r="50" stroke="white" strokeWidth="1" fill="none" />
      <circle cx="30" cy="222" r="32" stroke="white" strokeWidth="0.8" fill="none" />
      <path d="M340 0 Q370 30 400 0" stroke="white" strokeWidth="1" fill="none" />
      <path d="M400 20 Q370 30 400 50" stroke="white" strokeWidth="1" fill="none" />
      <path d="M0 200 Q30 222 0 252" stroke="white" strokeWidth="1" fill="none" />
      <path d="M20 252 Q30 222 60 252" stroke="white" strokeWidth="1" fill="none" />
    </svg>
  );
}
