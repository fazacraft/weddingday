import { motion } from "framer-motion";
import { Container } from "../../../components/ui/Container";
import { SectionWrapper } from "../../../components/ui/SectionWrapper";
import { FadeUp } from "../../../components/ui/FadeUp";
import { Button } from "../../../components/ui/Button";
import { OrnamentDivider } from "../Ornament";
import { useInvitation } from "../../shared/InvitationContext";
import { useLang } from "../../../context/LanguageContext";
import dayjs from "dayjs";
import { withBase } from "../../../lib/base";

interface DetailRowProps {
  label: string;
  value: string;
  index: number;
}

function DetailRow({ label, value, index }: DetailRowProps) {
  return (
    <motion.div
      className="py-3.5 border-b border-forest/10 last:border-0"
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
    >
      <p className="font-body text-[10px] tracking-[0.22em] uppercase text-charcoal/45 mb-0.5">
        {label}
      </p>
      <p className="font-formal text-xl md:text-2xl text-charcoal tracking-wide">
        {value}
      </p>
    </motion.div>
  );
}

export function EventDetailsSection() {
  const { t } = useLang();
  const { data: wedding } = useInvitation();
  const weddingDateFormatted = dayjs(wedding.date)
    .locale("uz-latn")
    .format("D MMMM YYYY");
  const address = [wedding.venueAddress, wedding.venueLandmark && `Mo'ljal: ${wedding.venueLandmark}`]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="relative overflow-hidden">
      {/* ── Airplane — floating animation ── */}
      <motion.div
        className="absolute top-10 left-4 md:left-10 w-56 md:w-72 lg:w-80 pointer-events-none rotate-[-14deg] z-0"
        animate={{ y: [-6, 8] }}
        transition={{
          duration: 3.5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <img src={withBase("/assets/airplate.png")} alt="" className="w-full h-auto" />
      </motion.div>

      {/* ── Car — subtle sway ── */}
      <motion.div
        className="absolute bottom-6 right-4 md:right-10 w-64 md:w-80 lg:w-96 pointer-events-none z-[1]"
        animate={{ x: [-4, 4] }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <img src={withBase("/assets/car.png")} alt="" className="w-full h-auto" />
      </motion.div>

      {/* Pastdan joy — mashina rasmi dastur va xarita tugmalarini yopmasligi uchun */}
      <SectionWrapper id="event" label={t("To'y kuni")} className="bg-cream !pb-44 md:!pb-56">
        <Container>
          <div className="relative z-10">
            <FadeUp>
              <h2 className="font-script text-5xl md:text-6xl text-forest text-center mb-2">
                {t("To'y marosimi")}
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <OrnamentDivider />
            </FadeUp>

            <div className="max-w-md mx-auto mt-8 divide-y divide-forest/10">
              <DetailRow label={t("Sana")} value={t(weddingDateFormatted)} index={0} />
              <DetailRow label={t("Vaqt")} value={t(wedding.time)} index={1} />
              <DetailRow label={t("Makon")} value={t(wedding.venueName)} index={2} />
              {address && (
                <DetailRow label={t("Manzil")} value={t(address)} index={3} />
              )}
              {wedding.dressCode && (
                <DetailRow
                  label={t("Kiyim kodi")}
                  value={t(wedding.dressCode)}
                  index={4}
                />
              )}
            </div>

            {wedding.schedule.length > 0 && (
              <div className="max-w-md mx-auto mt-12">
                <FadeUp>
                  <h3 className="font-script text-4xl md:text-5xl text-forest text-center mb-2">
                    {t("To'y dasturi")}
                  </h3>
                </FadeUp>
                <div className="mt-4">
                  {wedding.schedule.map((item, i) => (
                    <motion.div
                      key={`${item.time}-${item.title}`}
                      className="flex items-baseline gap-5 py-3.5 border-b border-forest/10 last:border-0"
                      initial={{ opacity: 0, x: -24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                    >
                      <p className="font-formal text-xl md:text-2xl text-forest tracking-wide shrink-0 w-16">
                        {item.time}
                      </p>
                      <p className="font-formal text-lg md:text-xl text-charcoal">
                        {t(item.title)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {(wedding.googleMapUrl || wedding.yandexMapUrl) && (
              <motion.div
                className="relative z-[20] flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
              >
                {wedding.googleMapUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(wedding.googleMapUrl, "_blank", "noopener")}
                  >
                    <MapPinIcon className="mr-2 w-4 h-4 shrink-0" />
                    Google Maps
                  </Button>
                )}
                {wedding.yandexMapUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(wedding.yandexMapUrl, "_blank", "noopener")}
                  >
                    <MapPinIcon className="mr-2 w-4 h-4 shrink-0" />
                    Yandex Maps
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </Container>
      </SectionWrapper>
    </div>
  );
}

/* ── Inline SVG icons ─────────────────────────────────────────────────── */

function MapPinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
