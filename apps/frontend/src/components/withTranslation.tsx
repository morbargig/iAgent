import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface WithTranslationProps {
  /** Translation key to use for the component's text content */
  i18nKey?: string;
  /** Parameters for translation interpolation */
  i18nParams?: Record<string, string>;
  /** Fallback text if translation fails */
  i18nFallback?: string;
  /** Whether to show the key if translation fails */
  i18nShowKey?: boolean;
}

/**
 * Higher-order component that adds translation capabilities to any component
 * Similar to Angular's i18n directive behavior
 * 
 * Usage:
 * const TranslatedButton = withTranslation(Button);
 * <TranslatedButton i18nKey="common.submit" onClick={handleClick} />
 */
export function withTranslation<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const TranslatedComponent = React.forwardRef<any, P & WithTranslationProps>(
    ({ i18nKey, i18nParams, i18nFallback, i18nShowKey = true, ...props }, ref) => {
      const { t } = useTranslation();

      // Get translated text (always call hooks)
      const translatedText = i18nKey ? t(i18nKey, i18nParams) : '';
      
      // Determine display text with fallback logic
      const displayText = React.useMemo(() => {
        if (!i18nKey) {
          return '';
        }
        
        if (translatedText !== i18nKey) {
          return translatedText;
        }
        
        if (i18nFallback) {
          return i18nFallback;
        }
        
        return i18nShowKey ? i18nKey : '';
      }, [i18nKey, translatedText, i18nFallback, i18nShowKey]);

      // If no translation key provided, render component as-is
      if (!i18nKey) {
        return <WrappedComponent {...(props as P)} ref={ref} />;
      }

      // Add the translated text as children if no children provided
      const enhancedProps = {
        ...props,
        children: (props as any).children || displayText,
      } as P;

      return <WrappedComponent {...enhancedProps} ref={ref} />;
    }
  );

  TranslatedComponent.displayName = `withTranslation(${WrappedComponent.displayName || WrappedComponent.name})`;

  return TranslatedComponent;
}

/**
 * Directive-like hook that automatically handles translation with fallbacks
 * Use this in components where you want automatic translation behavior
 */
export const useAutoTranslate = (
  key: string | undefined,
  params?: Record<string, string>,
  options?: {
    fallback?: string;
    showKeyOnFail?: boolean;
    defaultValue?: string;
  }
): string => {
  const { t } = useTranslation();
  const { fallback, showKeyOnFail = true, defaultValue = '' } = options || {};

  return React.useMemo(() => {
    // If no key provided, return default value
    if (!key) {
      return defaultValue;
    }

    const translatedText = t(key, params);
    
    // If translation succeeded
    if (translatedText !== key) {
      return translatedText;
    }
    
    // Translation failed - use fallback logic
    if (fallback) {
      return fallback;
    }
    
    if (showKeyOnFail) {
      return key;
    }
    
    return defaultValue;
  }, [key, params, t, fallback, showKeyOnFail, defaultValue]);
};

export default withTranslation; 