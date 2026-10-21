import { motion } from "framer-motion";
import { useLang, Lang } from "../../context/LanguageContext";

/**
 * Til almashtirish tugmasi — faqat kirish ekranida (WelcomeScreen) ishlatiladi.
 * Segmentli "pill" switch: tanlangan variant tagida forest rangli slayder suriladi.
 * Har bir variant o'z yozuvida ko'rsatiladi ("Lotin" lotincha, "Кирил" kirillcha),
 * shuning uchun bu yorliqlar transliteratsiya qilinmaydi.
 */

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "lotin", label: "Lotin" },
  { value: "kirill", label: "Кирил" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Til / Тил"
      className="inline-flex items-center gap-1 p-1 rounded-full
                 bg-white/70 backdrop-blur-md border border-forest/15
                 shadow-[0_4px_20px_rgba(48,64,28,0.10)]"
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            className={`relative rounded-full px-5 py-2 min-w-[76px]
                        font-formal text-base sm:text-lg leading-none tracking-wide
                        transition-colors duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40
                        ${active ? "text-cream" : "text-forest/60 hover:text-forest"}`}
          >
            {active && (
              <motion.span
                layoutId="lang-thumb"
                className="absolute inset-0 rounded-full bg-forest"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
