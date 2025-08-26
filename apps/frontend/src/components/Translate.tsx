import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface TranslateProps {
  /** Translation key to translate */
  i18nKey: string;
  /** Parameters to interpolate into the translation */
  params?: Record<string, string>;
  /** Fallback text to show if translation fails (optional) */
  fallback?: string;
  /** Whether to show the key if translation fails (default: true) */
  showKeyOnFail?: boolean;
  /** HTML tag to wrap the translation in (default: span) */
  as?: keyof React.JSX.IntrinsicElements;
  /** Additional props to pass to the wrapper element */
  [key: string]: any;
}

/**
 * Translation component that works like Angular's i18n directive
 * Automatically translates keys before display with fallback behavior
 * 
 * Usage:
 * <Translate i18nKey="common.hello" />
 * <Translate i18nKey="common.welcome" params={{ name: "John" }} />
 * <Translate i18nKey="errors.notFound" fallback="Error occurred" />
 * <Translate i18nKey="sidebar.title" as="h1" className="header" />
 */
export const Translate: React.FC<TranslateProps> = ({
  i18nKey,
  params,
  fallback,
  showKeyOnFail = true,
  as: Component = 'span',
  ...props
}) => {
  const { t } = useTranslation();

  // Get the translated text
  const translatedText = t(i18nKey, params);
  
  // Determine what to display
  const displayText = React.useMemo(() => {
    // If translation succeeded (returned text is different from key)
    if (translatedText !== i18nKey) {
      return translatedText;
    }
    
    // Translation failed - use fallback or key
    if (fallback) {
      return fallback;
    }
    
    if (showKeyOnFail) {
      return i18nKey;
    }
    
    return '';
  }, [translatedText, i18nKey, fallback, showKeyOnFail]);

  // Don't render anything if no text to display
  if (!displayText) {
    return null;
  }

  return React.createElement(Component as any, props, displayText);
};

/**
 * Hook version for more complex scenarios
 * Returns the translated text with the same fallback logic
 */
export const useTranslate = (
  i18nKey: string, 
  params?: Record<string, string>,
  options?: {
    fallback?: string;
    showKeyOnFail?: boolean;
  }
): string => {
  const { t } = useTranslation();
  const { fallback, showKeyOnFail = true } = options || {};
  
  const translatedText = t(i18nKey, params);
  
  return React.useMemo(() => {
    // If translation succeeded
    if (translatedText !== i18nKey) {
      return translatedText;
    }
    
    // Translation failed - use fallback or key
    if (fallback) {
      return fallback;
    }
    
    if (showKeyOnFail) {
      return i18nKey;
    }
    
    return '';
  }, [translatedText, i18nKey, fallback, showKeyOnFail]);
};

export default Translate; 