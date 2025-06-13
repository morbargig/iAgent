import React from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1>{t('header.title')}</h1>
        <div className="header-actions">
          <button className="mock-api-button">
            {t('common.mockApi')}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}; 