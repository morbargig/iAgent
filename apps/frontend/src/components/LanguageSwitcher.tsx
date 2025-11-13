import React, { useState } from 'react';
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box,
  useTheme,
  Tooltip
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTranslation } from '../contexts/TranslationContext';
import { SUPPORTED_LANGUAGES } from '../i18n/types';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export const LanguageSwitcher: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const enableLanguageSwitcher = useFeatureFlag('enableLanguageSwitcher');
  const { currentLang, changeLanguage, t } = useTranslation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  if (!enableLanguageSwitcher) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={t("common.changeLanguage") || "Change language"}>
        <IconButton
          id="language-button"
          onClick={handleClick}
          className="no-rtl-transform"
          aria-label="Change language"
          sx={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'transparent',
            color: theme.palette.text.secondary,
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.text.secondary,
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <LanguageIcon sx={{ fontSize: '18px' }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableAutoFocusItem
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: isDarkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
            minWidth: '160px',
            marginTop: '4px',
            pointerEvents: 'auto !important',
          },
          '& .MuiMenuItem-root': {
            borderRadius: '8px',
            margin: '4px 8px',
            fontSize: '14px',
            fontWeight: 400,
            color: theme.palette.text.primary,
            pointerEvents: 'auto !important',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            },
          },
          '& .MuiBackdrop-root': {
            pointerEvents: 'auto !important',
          },
        }}
      >
        <MenuItem 
          selected={currentLang === 'none'}
          onClick={() => handleLanguageChange('none')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">🔧</Typography>
            <Typography variant="body2">Raw Keys</Typography>
          </Box>
        </MenuItem>
        
        {SUPPORTED_LANGUAGES.map((lang) => {
          const getLanguageFlag = (code: string) => {
            switch (code) {
              case 'en': return '🇺🇸';
              case 'he': return '🇮🇱';
              case 'ar': return '🇸🇦';
              default: return '🌐';
            }
          };

          return (
            <MenuItem 
              key={lang.code}
              selected={currentLang === lang.code}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{getLanguageFlag(lang.code)}</Typography>
                <Typography variant="body2">{lang.name}</Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}; 