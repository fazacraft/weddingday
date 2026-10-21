import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useId,
} from "react";
import { Link, LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink/85 shadow-[0_8px_24px_-12px_rgba(31,26,23,0.6)]",
  secondary: "bg-white text-ink border border-ink/15 hover:border-ink/40",
  ghost: "text-ink/70 hover:text-ink hover:bg-ink/5",
  danger: "bg-white text-rose border border-rose/30 hover:bg-rose hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

interface PButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function PButton({ variant, size, loading, className = "", children, disabled, ...props }: PButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function PLink({
  variant,
  size,
  className = "",
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      aria-hidden="true"
    />
  );
}

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  id: string;
  children: ReactNode;
  optional?: boolean;
}

function FieldShell({ label, hint, error, id, children, optional }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink/80">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink/40">ixtiyoriy</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink/50 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white px-4 text-[15px] text-ink placeholder:text-ink/30 transition-colors focus:outline-none focus:ring-4 focus:ring-rose/10";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}

export function Field({ label, hint, error, optional, className = "", ...props }: FieldProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} optional={optional}>
      <input
        id={id}
        className={`${inputBase} h-12 ${error ? "border-rose" : "border-ink/15 focus:border-rose/60"} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}

export function Area({ label, hint, error, optional, className = "", ...props }: AreaProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} optional={optional}>
      <textarea
        id={id}
        className={`${inputBase} py-3 min-h-[120px] resize-y leading-relaxed ${error ? "border-rose" : "border-ink/15 focus:border-rose/60"} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description?: string;
}

export function Toggle({ checked, onChange, title, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white px-4 py-3.5 text-left transition-colors hover:border-ink/25"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {description && <span className="block text-xs text-ink/50 mt-0.5">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-rose" : "bg-ink/15"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const tones = {
    error: "bg-rose/5 text-rose border-rose/20",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-sand text-ink/80 border-ink/10",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.22em] text-rose ${className}`}>{children}</p>
  );
}
