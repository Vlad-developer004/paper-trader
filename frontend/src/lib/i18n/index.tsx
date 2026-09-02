import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./locales/en.js";
import { de } from "./locales/de.js";
import { ru } from "./locales/ru.js";
import { uk } from "./locales/uk.js";

export type Language = "en" | "de" | "ru" | "uk";
export type TranslationKey = keyof typeof en;

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, de, ru, uk };

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" },
];

const STORAGE_KEY = "paper-trader-lang";

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "de" || stored === "ru" || stored === "uk") return stored;
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === "en" || browserLang === "ru" || browserLang === "uk") return browserLang;
  return "de";
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang,
      t: (key, params) => {
        const template = dict[key];
        if (!params) return template;
        return Object.entries(params).reduce(
          (acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)),
          template,
        );
      },
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
