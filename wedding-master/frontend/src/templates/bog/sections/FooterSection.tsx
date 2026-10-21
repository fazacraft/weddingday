import { motion } from 'framer-motion';
import { Container } from "../../../components/ui/Container";
import { FadeUp } from "../../../components/ui/FadeUp";
import { Ornament } from "../Ornament";
import { useInvitation } from "../../shared/InvitationContext";
import { useLang } from "../../../context/LanguageContext";

export function FooterSection() {
  const { t } = useLang();
  const { data: wedding } = useInvitation();
  return (
    <footer className="bg-cream py-20 text-center border-t border-forest/10">
      <Container>
        <FadeUp delay={0}>
          <p className="font-body text-xs tracking-[0.3em] uppercase text-forest/50 mb-4">
            {t("Biz siz bilan nishonlashni sabrsizlik bilan kutmoqdamiz")}
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2 className="font-script text-5xl md:text-6xl text-forest mb-6">
            {t(wedding.groomName)} &amp; {t(wedding.brideName)}
          </h2>
        </FadeUp>

        <motion.div
          className="mx-auto mb-8 w-fit"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
        >
          <Ornament size="md" />
        </motion.div>

        <FadeUp delay={0.45}>
          <p className="font-body text-xs text-charcoal/30 tracking-widest uppercase">
            © {new Date().getFullYear()} — {t("Barcha huquqlar himoyalangan")}
          </p>
        </FadeUp>
      </Container>
    </footer>
  );
}
