import { TextareaHTMLAttributes, useRef, useCallback } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id,
  className = '',
  onChange,
  ...props
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

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
      <textarea
        ref={ref}
        id={id}
        rows={4}
        className={`bg-white border border-forest/30 rounded px-4 py-3 text-sm font-body text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest transition-colors resize-none overflow-hidden ${className}`}
        onChange={(e) => {
          autoResize();
          onChange?.(e);
        }}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 font-body">{error}</p>
      )}
    </div>
  );
}
