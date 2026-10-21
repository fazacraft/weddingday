import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { toCyrillic } from "../lib/transliterate";

export type Lang = "lotin" | "kirill";

const STORAGE_KEY = "wedding-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Manba matn (o'zbek lotin) — joriy tilga o'giriladi. */
  t: (text: string) => string;
}

const LanguageContext = createContext<LangContextValue | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "lotin";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "kirill"
      ? "kirill"
      : "lotin";
  } catch {
    return "lotin";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("lang-kirill", lang === "kirill");
    root.setAttribute("lang", lang === "kirill" ? "uz-Cyrl" : "uz-Latn");
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* localStorage mavjud emas — e'tiborsiz qoldiramiz */
    }
  }, []);

  const t = useCallback(
    (text: string) => (lang === "kirill" ? toCyrillic(text) : text),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLang must be used within a LanguageProvider");
  }
  return ctx;
}
