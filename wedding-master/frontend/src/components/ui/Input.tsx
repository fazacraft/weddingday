import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-body font-bold tracking-[0.15em] uppercase text-forest"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-white border border-forest/30 rounded px-4 py-3 text-sm font-body text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 font-body">{error}</p>
      )}
    </div>
  );
}
