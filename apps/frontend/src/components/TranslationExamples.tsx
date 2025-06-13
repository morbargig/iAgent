import React from 'react';
import { Button, Typography } from '@mui/material';
import { Translate, useTranslate } from './Translate';
import { withTranslation, useAutoTranslate } from './withTranslation';

// Example: Create translated versions of common components
const TranslatedButton = withTranslation(Button);
const TranslatedTypography = withTranslation(Typography);

/**
 * Examples of how to use the directive-like translation system
 * Similar to Angular's i18n directive
 */
export const TranslationExamples: React.FC = () => {
  // Hook examples
  const welcomeText = useTranslate('chat.welcome.title');
  const errorText = useAutoTranslate('errors.general', undefined, {
    fallback: 'Something went wrong',
    showKeyOnFail: false
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>Translation Directive Examples</h2>
      
      {/* Method 1: Using Translate component (most similar to Angular i18n) */}
      <div>
        <h3>1. Translate Component (Directive-like)</h3>
        <Translate i18nKey="chat.welcome.title" as="h4" />
        <Translate i18nKey="chat.welcome.subtitle" />
        <Translate 
          i18nKey="common.welcome" 
          params={{ name: "User" }} 
          fallback="Welcome!" 
        />
        <Translate 
          i18nKey="nonexistent.key" 
          fallback="This key doesn't exist" 
          showKeyOnFail={false}
        />
      </div>

      {/* Method 2: Using HOC (Higher-Order Component) */}
      <div>
        <h3>2. HOC with Translation Props</h3>
        <TranslatedButton 
          i18nKey="sidebar.newChat" 
          variant="contained" 
          color="primary"
        />
        <TranslatedTypography 
          i18nKey="chat.welcome.description" 
          variant="body1"
        />
        <TranslatedButton 
          i18nKey="nonexistent.button" 
          i18nFallback="Click Me" 
          i18nShowKey={false}
          variant="outlined"
        />
      </div>

      {/* Method 3: Using hooks for complex scenarios */}
      <div>
        <h3>3. Translation Hooks</h3>
        <p>Welcome text: {welcomeText}</p>
        <p>Error text: {errorText}</p>
        <p>
          Dynamic translation: {useTranslate('sidebar.conversations')}
        </p>
      </div>

      {/* Method 4: Conditional translation */}
      <div>
        <h3>4. Conditional Translation</h3>
        <Translate 
          i18nKey={Math.random() > 0.5 ? 'common.yes' : 'common.no'} 
          fallback="Maybe"
        />
      </div>
    </div>
  );
};

export default TranslationExamples; 