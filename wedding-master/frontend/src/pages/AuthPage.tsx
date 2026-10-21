import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { Logo } from "../platform/SiteChrome";
import { TemplateThumb } from "../platform/TemplateThumb";
import { Field, Notice, PButton } from "../platform/ui";

interface Props {
  mode: "login" | "register";
}

/** Faqat sayt ichidagi yo'llarga qaytaramiz (ochiq redirect'ning oldini olish). */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/kabinet";
}

export function AuthPage({ mode }: Props) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const fromBuilder = next.startsWith("/yaratish");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  const other = mode === "login"
    ? { to: `/royxatdan-otish?next=${encodeURIComponent(next)}`, text: "Hisobingiz yo'qmi?", cta: "Ro'yxatdan o'ting" }
    : { to: `/kirish?next=${encodeURIComponent(next)}`, text: "Hisobingiz bormi?", cta: "Kiring" };

  return (
    <div className="grid min-h-screen bg-ivory lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-4xl font-semibold text-ink">
            {mode === "login" ? "Xush kelibsiz" : "Hisob yaratish"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/55">
            {fromBuilder
              ? "Qoralamangiz saqlangan. Kirganingizdan so'ng nashr qilish sahifasiga qaytasiz."
              : mode === "login"
                ? "Taklifnomalaringizni boshqarish, javob va tilaklarni ko'rish uchun kiring."
                : "Taklifnomani nashr qilish va mehmonlar javobini kuzatish uchun."}
          </p>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-4">
            {mode === "register" && (
              <Field label="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Field
              label="Parol"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              hint={mode === "register" ? "Kamida 6 ta belgi" : undefined}
              minLength={mode === "register" ? 6 : undefined}
              required
            />
            {error && <Notice>{error}</Notice>}
            <PButton type="submit" size="lg" loading={busy} className="mt-2 w-full">
              {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </PButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink/55">
            {other.text}{" "}
            <Link to={other.to} className="font-semibold text-rose hover:underline">
              {other.cta}
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <TemplateThumb template="anor" groom="Feruz" bride="Dilfuza" date="29.10.2026" className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
