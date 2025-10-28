import React, { createContext, useContext, useEffect, useState } from "react";
import {
  TranslationContextType,
  TranslationState,
  SUPPORTED_LANGUAGES,
} from "../i18n/types";

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

const STORAGE_KEY = "preferred_language";
const DIRECTION_STORAGE_KEY = "preferred_direction";

const getInitialLanguage = (): string => {
  // First try to get from localStorage
  const storedLang = localStorage.getItem(STORAGE_KEY);
  if (
    storedLang &&
    (storedLang === "none" ||
      SUPPORTED_LANGUAGES.some((lang) => lang.code === storedLang))
  ) {
    return storedLang;
  }

  // Then try browser language
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
    localStorage.setItem(DIRECTION_STORAGE_KEY, direction);
  }
};

const restoreDocumentDirection = () => {
  const storedDirection = localStorage.getItem(DIRECTION_STORAGE_KEY);
  const storedLang = localStorage.getItem(STORAGE_KEY);

  if (storedDirection && storedLang) {
    document.documentElement.dir = storedDirection;
    document.documentElement.lang = storedLang;
  }
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<TranslationState>({
    currentLang: getInitialLanguage(),
    translations: {},
    isLoading: false,
    error: null,
  });

  const loadTranslation = async (lang: string) => {
    if (lang === "none") {
      setState((prev) => ({
        ...prev,
        translations: { ...prev.translations, [lang]: {} },
        isLoading: false,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const module = await import(`../i18n/translations/${lang}.ts`);
      setState((prev) => ({
        ...prev,
        translations: { ...prev.translations, [lang]: module.default },
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Failed to load ${lang} translations`,
        isLoading: false,
      }));
    }
  };

  const changeLanguage = async (lang: string) => {
    if (lang !== "none" && !SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
      setState((prev) => ({ ...prev, error: `Unsupported language: ${lang}` }));
      return;
    }

    if (!state.translations[lang]) {
      await loadTranslation(lang);
    }

    setState((prev) => ({ ...prev, currentLang: lang }));
    localStorage.setItem(STORAGE_KEY, lang);
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
    // Restore document direction on mount
    restoreDocumentDirection();
    loadTranslation(state.currentLang);
  }, []);

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
