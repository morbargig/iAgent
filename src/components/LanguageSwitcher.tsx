import React from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import { SUPPORTED_LANGUAGES } from '../i18n/types';

export const LanguageSwitcher: React.FC = () => {
  const { currentLang, changeLanguage } = useTranslation();

  return (
    <div className="language-switcher">
      <select
        value={currentLang}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}; 