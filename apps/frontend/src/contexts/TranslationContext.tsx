import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  TranslationContextType,
  TranslationState,
  SUPPORTED_LANGUAGES,
} from "../i18n/types";
import { useAppLocalStorage } from "../hooks/storage";

// Only keep current language + English fallback in memory to prevent memory leaks
const DEFAULT_FALLBACK_LANG = "en";

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

const getInitialLanguage = (): string => {
  const browserLang = navigator.language.split("-")[0];
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === browserLang)
    ? browserLang
    : "en";
};

const setDocumentDirection = (lang: string) => {
  if (lang !== "none") {
    const direction =
      SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.direction || "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = direction;
  }
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userPreferences, setUserPreferences] = useAppLocalStorage('user-preferences');
  const initialLang = userPreferences.language || getInitialLanguage();
  
  const [state, setState] = useState<TranslationState>({
    currentLang: initialLang,
    translations: {},
    isLoading: false,
    error: null,
  });

  const loadTranslation = useCallback(async (lang: string) => {
    if (lang === "none") {
      setState((prev) => ({
        ...prev,
        translations: { [lang]: {} },
        isLoading: false,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const module = await import(`../i18n/translations/${lang}.ts`);

      // Memory optimization: only keep current lang + fallback (English) to prevent unbounded growth
      setState((prev) => {
        const newTranslations: Record<string, Record<string, unknown>> = { [lang]: module.default };

        // Keep English fallback if loading a non-English language
        if (lang !== DEFAULT_FALLBACK_LANG && prev.translations[DEFAULT_FALLBACK_LANG]) {
          newTranslations[DEFAULT_FALLBACK_LANG] = prev.translations[DEFAULT_FALLBACK_LANG];
        }

        return {
          ...prev,
          translations: newTranslations,
          isLoading: false,
        };
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Failed to load ${lang} translations`,
        isLoading: false,
      }));
    }
  }, []);

  const changeLanguage = async (lang: string) => {
    if (lang !== "none" && !SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
      setState((prev) => ({ ...prev, error: `Unsupported language: ${lang}` }));
      return;
    }

    if (!state.translations[lang]) {
      await loadTranslation(lang);
    }

    setState((prev) => ({ ...prev, currentLang: lang }));
    setUserPreferences((prev) => ({ ...prev, language: lang }));
    setDocumentDirection(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (state.currentLang === "none") {
      return key;
    }

    const keys = key.split(".");
    let value: any = state.translations[state.currentLang];

    for (const k of keys) {
      if (!value || typeof value !== "object") return key;
      value = value[k];
    }

    if (typeof value !== "string") return key;

    if (params) {
      return Object.entries(params).reduce(
        (str, [key, val]) => str.replace(new RegExp(`{{${key}}}`, "g"), val),
        value
      );
    }

    return value;
  };

  useEffect(() => {
    setDocumentDirection(state.currentLang);
    loadTranslation(state.currentLang);
  }, [loadTranslation]);

  // Set direction when language changes
  useEffect(() => {
    setDocumentDirection(state.currentLang);
  }, [state.currentLang]);

  return (
    <TranslationContext.Provider value={{ ...state, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }

  const isRTL = context.currentLang === "he" || context.currentLang === "ar";

  return { ...context, isRTL };
};
