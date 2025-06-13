import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { SUPPORTED_LANGUAGES } from '../i18n/types';

export const LanguageSwitcher: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const { currentLang, changeLanguage } = useTranslation();

  return (
    <select
      value={currentLang}
      onChange={(e) => changeLanguage(e.target.value)}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: '32px',
      }}
    >
      <option value="none">Raw Keys</option>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}; 