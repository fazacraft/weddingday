import { Container } from "../../../components/ui/Container";
import { SectionWrapper } from "../../../components/ui/SectionWrapper";
import { FadeUp } from "../../../components/ui/FadeUp";
import { OrnamentDivider } from "../Ornament";
import { PhotoGallery, useGalleryPhotos } from "../../shared/PhotoGallery";
import { useLang } from "../../../context/LanguageContext";

export function GallerySection() {
  const { t } = useLang();
  const photos = useGalleryPhotos();
  if (photos.length === 0) return null;

  return (
    <SectionWrapper id="gallery" className="bg-cream">
      <Container>
        <FadeUp>
          <h2 className="font-script text-4xl md:text-5xl text-forest text-center mb-2">{t("Fotogalereya")}</h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <OrnamentDivider />
        </FadeUp>
        <FadeUp delay={0.15} className="max-w-xl mx-auto mt-8">
          <PhotoGallery photos={photos} />
        </FadeUp>
      </Container>
    </SectionWrapper>
  );
}
