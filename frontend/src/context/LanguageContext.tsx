import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../translations/translations";
import type { Language, TranslationKey } from "../translations/translations";

type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("epashucare-language") : null;
    return stored === "gu" ? "gu" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem("epashucare-language", language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => setLanguage((prev) => (prev === "en" ? "gu" : "en")),
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
