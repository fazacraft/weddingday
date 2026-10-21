import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';

interface Props {
  isPlaying: boolean;
  onToggleMusic: () => void;
}

export function FloatingControls({ isPlaying, onToggleMusic }: Props) {
  const { t } = useLang();
  const [hint, setHint] = useState<string | null>(null);

  return (
    <div className="fixed bottom-6 right-4 z-[9000] flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {hint && (
          <motion.span
            key={hint}
            className="text-[10px] font-body tracking-wide text-cream/80 bg-forest/80 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
          >
            {hint}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onToggleMusic}
        onMouseEnter={() => setHint(isPlaying ? t("Musiqani o'chirish") : t('Musiqani yoqish'))}
        onMouseLeave={() => setHint(null)}
        className="w-11 h-11 rounded-full bg-forest backdrop-blur-md text-cream flex items-center justify-center shadow-xl border border-cream/15"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        aria-label={isPlaying ? t("Musiqani o'chirish") : t('Musiqani yoqish')}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isPlaying ? 'pause' : 'play'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
