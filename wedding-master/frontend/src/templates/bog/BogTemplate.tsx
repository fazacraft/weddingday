import { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { WelcomeScreen } from "./WelcomeScreen";
import { HomePage } from "./HomePage";
import { AllWishesPage } from "./AllWishesPage";
import { FloatingPetals } from "./FloatingPetals";
import { FloatingControls } from "./FloatingControls";
import { useInvitation } from "../shared/InvitationContext";
import { useCountOpen } from "../shared/useRsvp";
import { useSlotFocus } from "../shared/useSlotFocus";
import { useDeferredAudioPreload } from "../shared/useDeferredAudioPreload";
import "dayjs/locale/uz-latn";

/** "Bog'" shabloni — yashil-krem ranglar, arka, kaptarlar va musiqali kirish ekrani. */
export default function BogTemplate() {
  const { data, musicUrl } = useInvitation();
  const countOpen = useCountOpen();
  const [hasEntered, setHasEntered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useSlotFocus(() => setHasEntered(true));
  useDeferredAudioPreload(audioRef);

  useEffect(() => {
    const audio = new Audio();
    // Rasmlar yuklangach fonda yuklanadi (useDeferredAudioPreload)
    audio.preload = "none";
    audio.src = musicUrl;
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, [musicUrl]);

  const handleEnter = () => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
    setHasEntered(true);
    countOpen();
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying((p) => !p);
  };

  return (
    <div className="tpl-bog bg-cream text-charcoal font-body min-h-screen">
      <AnimatePresence>
        {!hasEntered && <WelcomeScreen key="welcome" onEnter={handleEnter} />}
      </AnimatePresence>

      {hasEntered && (
        <>
          <FloatingPetals />
          <FloatingControls isPlaying={isPlaying} onToggleMusic={toggleMusic} />
          <Routes>
            <Route index element={<HomePage />} />
            {data.features.wishes && <Route path="tilaklar" element={<AllWishesPage />} />}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </>
      )}
    </div>
  );
}
