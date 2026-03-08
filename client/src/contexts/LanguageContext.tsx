import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "en" | "fr" | "es" | "de" | "it" | "pt" | "nl" | "tr" | "ru" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("app-language");
      const valid: Language[] = ["en", "fr", "es", "de", "it", "pt", "nl", "tr", "ru", "ar"];
      return valid.includes(saved as Language) ? (saved as Language) : "fr";
    }
    return "fr";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
    // Pour l'arabe (langue RTL), on change la direction du document
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
