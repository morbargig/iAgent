export interface Translation {
  [key: string]: string | Translation | string[];
}

export interface LanguageConfig {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

export interface TranslationState {
  currentLang: string;
  translations: Record<string, Translation>;
  isLoading: boolean;
  error: string | null;
}

export interface TranslationContextType extends TranslationState {
  changeLanguage: (lang: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'he', name: 'עברית', direction: 'rtl' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
]; 