import { HeroSection } from "./sections/HeroSection";
import { GreetingSection } from "./sections/GreetingSection";
import { QuoteSection } from "./sections/QuoteSection";
import { CountdownSection } from "./sections/CountdownSection";
import { EventDetailsSection } from "./sections/EventDetailsSection";
import { RsvpSection } from "./sections/RsvpSection";
import { GiftSection } from "./sections/GiftSection";
import { WishesSection } from "./sections/WishesSection";
import { FooterSection } from "./sections/FooterSection";
import { useInvitation } from "../shared/InvitationContext";

export function HomePage() {
  const { data } = useInvitation();
  return (
    <main>
      <HeroSection />
      <GreetingSection />
      <QuoteSection />
      <CountdownSection />
      <EventDetailsSection />
      {data.features.rsvp && <RsvpSection />}
      {data.features.gift && data.cardNumber && <GiftSection />}
      {data.features.wishes && <WishesSection />}
      <FooterSection />
    </main>
  );
}
