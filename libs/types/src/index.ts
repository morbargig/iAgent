export interface Translation {
  [key: string]: string | Translation;
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    index?: number;
    total_tokens?: number;
    timestamp?: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    processing_time_ms?: number;
    confidence?: number;
    categories?: string[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'he', name: 'עברית', direction: 'rtl' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
]; 