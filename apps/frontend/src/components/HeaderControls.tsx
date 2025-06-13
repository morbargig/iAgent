import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Box } from '@mui/material';

interface HeaderControlsProps {
  isDarkMode: boolean;
  isMockMode: boolean;
  onToggleMockMode: () => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  isDarkMode,
  isMockMode,
  onToggleMockMode,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        p: 2,
        direction: 'ltr', // Force LTR for consistent button layout
      }}
    >
      <LanguageSwitcher isDarkMode={isDarkMode} />
      <button
        onClick={onToggleMockMode}
        className="mock-api-button"
        style={{
          paddingBlock: '8px',
          paddingInline: '16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          direction: 'ltr', // Force LTR for button text
        }}
      >
        {isMockMode ? t('common.disableMockApi') : t('common.enableMockApi')}
      </button>
    </Box>
  );
}; 