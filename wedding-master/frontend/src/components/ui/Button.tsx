import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-9 py-3 text-xs font-body font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-forest text-white border border-forest',
    outline: 'bg-cream/90 backdrop-blur-sm text-forest border border-forest',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
