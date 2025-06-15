import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  useTheme,
  Typography,
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from '../contexts/TranslationContext';
import { Translate } from './Translate';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onDiscard?: () => void;
  disabled: boolean;
  isLoading?: boolean;
  isDarkMode: boolean;
  isEditing?: boolean;
  sidebarOpen?: boolean; // Add sidebar state
}

// ChatGPT-style Input Area - Matches official ChatGPT design

export function InputArea({ 
  value, 
  onChange, 
  onSend, 
  onStop,
  disabled, 
  isLoading = false,
  isDarkMode,
  sidebarOpen = false
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        onSend();
      }
    }
  };

  const handleSubmit = () => {
    if (isLoading && onStop) {
      onStop();
    } else if (value.trim() && !disabled) {
      onSend();
    }
  };

  const canSend = value.trim() && !disabled;
  const showStopButton = isLoading;

  return (
    <>
      {/* Sticky Bottom Container */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          insetInlineStart: sidebarOpen ? '280px' : '0',
          insetInlineEnd: 0,
          zIndex: 10,
          background: isDarkMode 
            ? 'linear-gradient(180deg, rgba(52, 53, 65, 0) 0%, rgba(52, 53, 65, 0.8) 50%, #343541 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, #ffffff 100%)',
          paddingTop: '20px',
          paddingBottom: '20px',
          transition: 'inset-inline-start 0.3s ease',
          '@media (max-width: 768px)': {
            insetInlineStart: 0,
            paddingBottom: 'env(safe-area-inset-bottom, 10px)',
            paddingTop: '10px',
          }
        }}
      >
        <Box
          sx={{
            maxWidth: '768px',
            margin: '0 auto',
            paddingLeft: '20px',
            paddingRight: '20px',
            '@media (max-width: 600px)': {
              paddingLeft: '10px',
              paddingRight: '10px',
            }
          }}
        >

          {/* Main Input Container */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: '24px',
              backgroundColor: isDarkMode ? '#40414f' : '#f7f7f8',
              border: isFocused 
                ? `1px solid ${isDarkMode ? '#565869' : '#d1d5db'}` 
                : `1px solid ${isDarkMode ? '#565869' : '#d1d5db'}`,
              boxShadow: isFocused
                ? `0 0 0 2px ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                : '0 2px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
              },
              '@media (max-width: 600px)': {
                marginBottom: 'env(safe-area-inset-bottom, 10px)',
              },
              // Placeholder styling - respects document direction
              '& textarea::placeholder': {
                opacity: 0.7,
              },
              '& textarea::-webkit-input-placeholder': {
                opacity: 0.7,
              },
              '& textarea::-moz-placeholder': {
                opacity: 0.7,
              },
              '& textarea:-ms-input-placeholder': {
                opacity: 0.7,
              }
            }}
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={t('input.placeholder')}
              disabled={disabled}
              style={{
                width: '100%',
                minHeight: '52px',
                maxHeight: '200px',
                paddingTop: '14px',
                paddingBottom: '14px',
                paddingInlineStart: '16px', // Use logical properties for RTL/LTL
                paddingInlineEnd: '50px',   // Space for send button
                border: 'none',
                outline: 'none',
                resize: 'none',
                backgroundColor: 'transparent',
                color: isDarkMode ? '#ececf1' : '#374151',
                fontSize: '16px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                lineHeight: '1.5',
                overflow: 'hidden',
                fontWeight: '400',
                WebkitAppearance: 'none',

                position: 'relative',
                zIndex: 1,
                cursor: 'text',
                direction: 'inherit', // Inherit document direction (RTL/LTL)
              }}
            />

            {/* Submit/Stop Button */}
            <IconButton
              onClick={handleSubmit}
              disabled={!canSend && !showStopButton}
              sx={{
                position: 'absolute',
                insetInlineEnd: '8px', // Use logical property for RTL/LTR
                bottom: '8px',
                width: '36px',
                height: '36px',
                backgroundColor: showStopButton 
                  ? (isDarkMode ? '#565869' : '#f3f4f6')
                  : canSend 
                    ? (isDarkMode ? '#ffffff' : '#000000')
                    : 'transparent',
                color: showStopButton
                  ? (isDarkMode ? '#ffffff' : '#374151')
                  : canSend 
                    ? (isDarkMode ? '#000000' : '#ffffff')
                    : (isDarkMode ? '#6b7280' : '#9ca3af'),
                borderRadius: '18px',
                transition: 'all 0.2s ease',
                zIndex: 2,
                '&:hover': {
                  backgroundColor: showStopButton
                    ? (isDarkMode ? '#6b7280' : '#e5e7eb')
                    : canSend 
                      ? (isDarkMode ? '#f3f4f6' : '#374151')
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                  transform: canSend || showStopButton ? 'scale(1.05)' : 'none',
                },
                '&:disabled': {
                  backgroundColor: 'transparent',
                  color: isDarkMode ? '#6b7280' : '#9ca3af',
                },
                '@media (max-width: 600px)': {
                  width: '44px',
                  height: '44px',
                  insetInlineEnd: '6px', // Use logical property for RTL/LTR
                  bottom: '4px',
                }
              }}
            >
              {showStopButton ? (
                <StopIcon sx={{ fontSize: 20 }} />
              ) : (
                <SendIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Box>

          {/* Helper Text */}
          <Translate
            i18nKey="input.disclaimer"
            fallback="AI can make mistakes. Check important info."
            as="div"
            style={{
              display: 'block',
              marginTop: '8px',
              color: isDarkMode ? '#8e8ea0' : '#6b7280',
              fontSize: '12px',
              lineHeight: '16px',
              direction: 'inherit',
            }}
          />
        </Box>
      </Box>
    </>
  );
} 