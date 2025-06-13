import React, { createContext, useContext, useEffect, useState } from 'react';
import { TranslationContextType, TranslationState, SUPPORTED_LANGUAGES } from './types';

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const getInitialLanguage = (): string => {
  // Get user's preferred language from browser
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang) 
    ? browserLang 
    : 'en';
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TranslationState>({
    currentLang: getInitialLanguage(),
    translations: {},
    isLoading: false,
    error: null,
  });

  const loadTranslation = async (lang: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const module = await import(`./translations/${lang}.ts`);
      setState(prev => ({
        ...prev,
        translations: { ...prev.translations, [lang]: module.default },
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to load ${lang} translations`,
        isLoading: false,
      }));
    }
  };

  const changeLanguage = async (lang: string) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      setState(prev => ({ ...prev, error: `Unsupported language: ${lang}` }));
      return;
    }

    if (!state.translations[lang]) {
      await loadTranslation(lang);
    }

    setState(prev => ({ ...prev, currentLang: lang }));
    document.documentElement.lang = lang;
    document.documentElement.dir = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.direction || 'ltr';
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = state.translations[state.currentLang];

    for (const k of keys) {
      if (!value || typeof value !== 'object') return key;
      value = value[k];
    }

    if (typeof value !== 'string') return key;

    if (params) {
      return Object.entries(params).reduce(
        (str, [key, val]) => str.replace(new RegExp(`{{${key}}}`, 'g'), val),
        value
      );
    }

    return value;
  };

  useEffect(() => {
    loadTranslation(state.currentLang);
  }, []);

  return (
    <TranslationContext.Provider value={{ ...state, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}; 