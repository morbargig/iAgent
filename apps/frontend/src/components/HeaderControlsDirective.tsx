import React from 'react';
import { Box, Button } from '@mui/material';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Translate } from './Translate';
import { withTranslation, useAutoTranslate } from './withTranslation';

// Create a translated button component using HOC
const TranslatedButton = withTranslation(Button);

interface HeaderControlsDirectiveProps {
  isDarkMode: boolean;
  isMockMode: boolean;
  onToggleMockMode: () => void;
}

/**
 * HeaderControls component using directive-like translation system
 * Demonstrates different ways to use Angular-like i18n directives in React
 */
export const HeaderControlsDirective: React.FC<HeaderControlsDirectiveProps> = ({
  isDarkMode,
  isMockMode,
  onToggleMockMode,
}) => {
  // Method 1: Using useAutoTranslate hook for dynamic keys
  const mockButtonText = useAutoTranslate(
    isMockMode ? 'common.disableMockApi' : 'common.enableMockApi',
    undefined,
    {
      fallback: isMockMode ? 'Disable Mock' : 'Enable Mock',
      showKeyOnFail: false
    }
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        p: 2,
      }}
    >
      <LanguageSwitcher isDarkMode={isDarkMode} />
      
      {/* Method 1: Using Translate component (most Angular-like) */}
      <Button
        onClick={onToggleMockMode}
        variant="contained"
        color="primary"
        sx={{
          backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
          '&:hover': {
            backgroundColor: isDarkMode ? '#2563eb' : '#1d4ed8',
          },
        }}
      >
        <Translate 
          i18nKey={isMockMode ? 'common.disableMockApi' : 'common.enableMockApi'}
          fallback={isMockMode ? 'Disable Mock' : 'Enable Mock'}
          showKeyOnFail={false}
        />
      </Button>

      {/* Method 2: Using HOC with translation props */}
      <TranslatedButton
        i18nKey={isMockMode ? 'common.disableMockApi' : 'common.enableMockApi'}
        i18nFallback={isMockMode ? 'Disable Mock' : 'Enable Mock'}
        i18nShowKey={false}
        onClick={onToggleMockMode}
        variant="outlined"
        color="secondary"
      />

      {/* Method 3: Using hook for complex logic */}
      <Button
        onClick={onToggleMockMode}
        variant="text"
        color="inherit"
      >
        {mockButtonText}
      </Button>

      {/* Method 4: Static translations with Translate component */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Translate i18nKey="header.title" as="h6" style={{ margin: 0, fontSize: '12px' }} />
        <Translate 
          i18nKey="header.subtitle" 
          as="small" 
          style={{ fontSize: '10px', opacity: 0.7 }}
          fallback="iAgent"
        />
      </Box>
    </Box>
  );
};

export default HeaderControlsDirective; 