import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Container } from "../../components/ui/Container";
import { FadeUp } from "../../components/ui/FadeUp";
import { OrnamentDivider } from "./Ornament";
import { WishCard } from "./WishCard";
import { WishForm } from "./WishForm";
import { useWishes } from "../shared/useWishes";
import { useLang } from "../../context/LanguageContext";
import { useInvitation } from "../shared/InvitationContext";

export function AllWishesPage() {
  const { t } = useLang();
  const { basePath } = useInvitation();
  const { wishes, loading, submitting, error, submitWish } = useWishes();

  // Sahifa ochilganda tepaga qaytaramiz.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-cream-dark py-16 md:py-20">
      <Container>
        <Link
          to={`${basePath || "/"}${window.location.search}`}
          className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-forest/70 transition-opacity hover:opacity-70 mb-10"
        >
          <span aria-hidden="true">←</span>
          {t("Bosh sahifa")}
        </Link>

        <FadeUp>
          <h1 className="font-script text-5xl md:text-6xl text-forest text-center mb-2">
            {t("Barcha tilaklar")}
          </h1>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="font-body text-sm text-center text-charcoal/60">
            {loading
              ? t("Yuklanmoqda...")
              : `${wishes.length} ${t("ta tilak va tabrik")}`}
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <OrnamentDivider />
        </FadeUp>

        <div className="mt-12">
          {loading ? (
            <motion.p
              className="text-center font-body text-sm text-charcoal/40"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              {t("Yuklanmoqda...")}
            </motion.p>
          ) : wishes.length === 0 ? (
            <p className="text-center font-body text-sm text-charcoal/40">
              {t("Hali tilaklar yo'q. Birinchi bo'ling!")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {wishes.map((wish, i) => (
                <motion.div
                  key={wish._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: i < 9 ? (i % 3) * 0.08 : 0,
                  }}
                >
                  <WishCard
                    name={wish.name}
                    message={wish.message}
                    createdAt={wish.createdAt}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Bu sahifadan ham tilak qoldirish mumkin */}
        <div className="mt-16 border-t border-forest/10 pt-10">
          <h2 className="font-script text-4xl text-forest text-center mb-6">
            {t("Siz ham tilak qoldiring")}
          </h2>
          <WishForm
            submitWish={submitWish}
            submitting={submitting}
            error={error}
          />
        </div>
      </Container>
    </main>
  );
}
