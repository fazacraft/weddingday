import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '../../../components/ui/Container';
import { SectionWrapper } from '../../../components/ui/SectionWrapper';
import { FadeUp } from '../../../components/ui/FadeUp';
import { OrnamentDivider } from '../Ornament';
import { useInvitation } from '../../shared/InvitationContext';
import { useLang } from '../../../context/LanguageContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function FlipNumber({ value }: { value: number }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="overflow-hidden relative h-[60px] md:h-[72px] flex items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          className="font-formal text-5xl md:text-6xl font-light text-white block leading-none"
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 28, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function CountdownSection() {
  const { t } = useLang();
  const { weddingAt } = useInvitation();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(weddingAt));

  useEffect(() => {
    setTimeLeft(getTimeLeft(weddingAt));
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(weddingAt));
    }, 1000);
    return () => clearInterval(id);
  }, [weddingAt]);

  const units: { label: string; value: number }[] = [
    { label: 'Kun', value: timeLeft.days },
    { label: 'Soat', value: timeLeft.hours },
    { label: 'Daqiqa', value: timeLeft.minutes },
    { label: 'Soniya', value: timeLeft.seconds },
  ];

  return (
    <SectionWrapper className="bg-forest text-white">
      <Container>
        <FadeUp>
          <OrnamentDivider className="[&>span]:bg-white/20 [&>svg_path]:fill-white [&>svg_circle]:fill-white" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="font-script text-4xl md:text-5xl text-center text-white mb-12">
            {t("To'yga qadar")}
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {units.map(({ label, value }, i) => (
            <motion.div
              key={label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1], delay: i * 0.1 }}
            >
              <div className="bg-white/10 rounded-xl py-6 px-4">
                <FlipNumber value={value} />
              </div>
              <p className="font-body text-xs tracking-[0.2em] uppercase text-white/60 mt-3">
                {t(label)}
              </p>
            </motion.div>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <OrnamentDivider className="mt-12 [&>span]:bg-white/20 [&>svg_path]:fill-white [&>svg_circle]:fill-white" />
        </FadeUp>
      </Container>
    </SectionWrapper>
  );
}
