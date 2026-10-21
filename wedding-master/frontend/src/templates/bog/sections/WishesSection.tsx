import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Container } from "../../../components/ui/Container";
import { SectionWrapper } from "../../../components/ui/SectionWrapper";
import { FadeUp } from "../../../components/ui/FadeUp";
import { OrnamentDivider } from "../Ornament";
import { WishForm } from "../WishForm";
import { WishesMarquee } from "../WishesMarquee";
import { useWishes } from "../../shared/useWishes";
import { useLang } from "../../../context/LanguageContext";
import { useInvitation } from "../../shared/InvitationContext";

export function WishesSection() {
  const { t } = useLang();
  const { basePath } = useInvitation();
  const { wishes, loading, submitting, error, submitWish } = useWishes();

  return (
    <SectionWrapper id="wishes" label={t("Tilaklar")} className="bg-cream-dark">
      <Container>
        <FadeUp>
          <h2 className="font-script text-5xl md:text-6xl text-forest text-center mb-2">
            {t("Tilak va tabriklar")}
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="font-body text-sm text-center text-charcoal/60 mb-2">
            {t("Yangi oilaga eng samimiy tilak va tabriklaringizni qoldiring")}
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <OrnamentDivider />
        </FadeUp>

        <WishForm submitWish={submitWish} submitting={submitting} error={error} />
      </Container>

      {/* Tilaklar karuseli — Container'dan tashqarida, to'liq kenglikda aylanadi */}
      <div className="mt-14">
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
          <>
            <WishesMarquee wishes={wishes} />

            <div className="flex justify-center mt-10">
              <Link
                to={`${basePath}/tilaklar${window.location.search}`}
                className="inline-flex items-center gap-2 rounded-full px-9 py-3 text-xs font-body font-bold tracking-[0.2em] uppercase bg-cream/90 text-forest border border-forest transition-opacity hover:opacity-80"
              >
                {t("Barcha tilaklar")}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </SectionWrapper>
  );
}
