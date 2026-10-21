import { ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
  label?: string;
}

export function SectionWrapper({
  children,
  id,
  className = '',
  label,
}: SectionWrapperProps) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`}>
      {label && (
        <p className="text-center font-body text-xs tracking-[0.25em] uppercase text-forest/60 mb-8">
          {label}
        </p>
      )}
      {children}
    </section>
  );
}
