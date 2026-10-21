import { motion } from 'framer-motion';
import { QuoteCard } from "./HeroSection";
import { useLang } from "../../../context/LanguageContext";

export function QuoteSection() {
  const { t } = useLang();
  return (
    <section className="bg-cream px-5 py-8 sm:py-12">
      {/* Separator */}
      <motion.div
        className="flex items-center gap-3 justify-center mb-6"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span className="h-px flex-1 bg-forest/15" />
        <span className="text-forest/30 text-xs">✦</span>
        <span className="h-px flex-1 bg-forest/15" />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
        >
          <QuoteCard
            text={t("U zot sizlar uchun o'zlaringizdan juftlar yaratdi, ular bilan taskin topishingiz uchun, orangizda mehr va rahmat paydo qildi.")}
            ref_={t("Ar-Rum, 30:21")}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.25 }}
        >
          <QuoteCard
            text={t("Ular sizlar uchun libos, sizlar ham ular uchun libossiz.")}
            ref_={t("Al-Baqara, 2:187")}
          />
        </motion.div>
      </div>
    </section>
  );
}
