interface OrnamentProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Ornament({ className = '', size = 'md' }: OrnamentProps) {
  const sizes = { sm: 48, md: 80, lg: 120 };
  const s = sizes[size];

  return (
    <svg
      width={s}
      height={s / 2}
      viewBox="0 0 160 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M80 20 L90 40 L80 60 L70 40 Z" fill="#30401c" opacity="0.7" />
      <path
        d="M60 40 Q40 25 20 30 Q35 40 20 50 Q40 55 60 40Z"
        fill="#30401c"
        opacity="0.45"
      />
      <path
        d="M100 40 Q120 25 140 30 Q125 40 140 50 Q120 55 100 40Z"
        fill="#30401c"
        opacity="0.45"
      />
      <circle cx="80" cy="10" r="3" fill="#30401c" opacity="0.5" />
      <circle cx="80" cy="70" r="3" fill="#30401c" opacity="0.5" />
      <circle cx="10" cy="40" r="2.5" fill="#30401c" opacity="0.3" />
      <circle cx="150" cy="40" r="2.5" fill="#30401c" opacity="0.3" />
    </svg>
  );
}

export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 my-6 ${className}`}>
      <span className="h-px bg-forest/25 flex-1" />
      <Ornament size="sm" />
      <span className="h-px bg-forest/25 flex-1" />
    </div>
  );
}
