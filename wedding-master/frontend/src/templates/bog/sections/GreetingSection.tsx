import { Container } from "../../../components/ui/Container";
import { SectionWrapper } from "../../../components/ui/SectionWrapper";
import { FadeUp } from "../../../components/ui/FadeUp";
import { OrnamentDivider } from "../Ornament";
import { useInvitation } from "../../shared/InvitationContext";
import { useLang } from "../../../context/LanguageContext";

export function GreetingSection() {
  const { t } = useLang();
  const { data, paragraphs, couplePhoto } = useInvitation();
  if (!data.greetingHeading && paragraphs.length === 0 && !couplePhoto) return null;

  return (
    <SectionWrapper id="greeting" className="bg-cream">
      <Container>
        {data.greetingHeading && (
          <FadeUp>
            <h2 className="font-script text-4xl md:text-5xl text-forest text-center mb-2">
              {t(data.greetingHeading)}
            </h2>
          </FadeUp>
        )}

        <FadeUp delay={0.1}>
          <OrnamentDivider />
        </FadeUp>

        <div className="max-w-xl mx-auto mt-8 space-y-4">
          {paragraphs.map((paragraph, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.1}>
              <p className="font-formal italic text-lg md:text-xl text-charcoal/80 text-center leading-relaxed">
                {t(paragraph)}
              </p>
            </FadeUp>
          ))}
        </div>

        {couplePhoto && (
          <FadeUp delay={0.3} className="mt-12 flex justify-center">
            {/* Arka shaklidagi ramka — bosh sahifadagi arkaga hamohang */}
            <div className="w-full max-w-xs rounded-t-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-forest/15">
              <img
                src={couplePhoto}
                alt={`${data.groomName} va ${data.brideName}`}
                className="w-full aspect-[3/4] object-cover"
                loading="lazy"
              />
            </div>
          </FadeUp>
        )}
      </Container>
    </SectionWrapper>
  );
}
