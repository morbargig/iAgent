import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  useTheme,
  Typography,
  TextField,
  Button,
  Tooltip,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import {
  Send as SendIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Mic as MicIcon,
  Clear as ClearIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useTranslation } from '../contexts/TranslationContext';
import { Translate } from './Translate';
import { useAnimatedPlaceholder } from '../hooks/useAnimatedPlaceholder';
import { useToolToggles } from '../hooks/useToolToggles';
import BasicDateRangePicker from './BasicDateRangePicker';

// Helper function to detect text direction
const detectLanguage = (text: string): 'ltr' | 'rtl' => {
  if (!text) return 'ltr';
  
  // Hebrew and Arabic character ranges
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  return rtlRegex.test(text) ? 'rtl' : 'ltr';
};

export interface DateFilter {
  type: 'custom' | 'picker';
  customRange?: {
    amount: number;
    type: string;
  };
  dateRange?: [Dayjs | null, Dayjs | null];
}

export interface SendMessageData {
  content: string;
  dateFilter: DateFilter;
  selectedCountries: string[];
  enabledTools: string[];
}

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (data: SendMessageData) => void;
  onStop?: () => void;
  onDiscard?: () => void;
  disabled: boolean;
  isLoading?: boolean;
  isDarkMode: boolean;
  isEditing?: boolean;
  sidebarOpen?: boolean; // Add sidebar state
  sidebarRef?: React.RefObject<HTMLDivElement | null>; // Add sidebar ref
  onHeightChange?: (height: number) => void; // Callback for height changes
  // Control buttons
  onVoiceInput?: () => void; // Voice input callback
  onClear?: () => void; // Clear input callback
  onAttachment?: () => void; // File attachment callback
  showVoiceButton?: boolean; // Show voice button
  showClearButton?: boolean; // Show clear button
  showAttachmentButton?: boolean; // Show attachment button
}

// ChatGPT-style Input Area - Matches official ChatGPT design

// Flag options with country data
const flagOptions = [
  { code: 'PS', flag: '🇵🇸', nameKey: 'countries.palestine' },
  { code: 'LB', flag: '🇱🇧', nameKey: 'countries.lebanon' },
  { code: 'SA', flag: '🇸🇦', nameKey: 'countries.saudi_arabia' },
  { code: 'IQ', flag: '🇮🇶', nameKey: 'countries.iraq' },
  { code: 'SY', flag: '🇸🇾', nameKey: 'countries.syria' },
  { code: 'JO', flag: '🇯🇴', nameKey: 'countries.jordan' },
  { code: 'EG', flag: '🇪🇬', nameKey: 'countries.egypt' },
  { code: 'IL', flag: '🇮🇱', nameKey: 'countries.israel' },
];

// Tools list data
const toolsList = [
  { id: 'tool-x', nameKey: 'tools.toolX' },
  { id: 'tool-y', nameKey: 'tools.toolY' },
  { id: 'tool-z', nameKey: 'tools.toolZ' },
];

// Time range options
const timeRangeOptions = [
  { value: 'minutes', labelKey: 'dateRange.minutes' },
  { value: 'hours', labelKey: 'dateRange.hours' },
  { value: 'days', labelKey: 'dateRange.days' },
  { value: 'weeks', labelKey: 'dateRange.weeks' },
  { value: 'months', labelKey: 'dateRange.months' },
  { value: 'years', labelKey: 'dateRange.years' },
];

export function InputArea({ 
  value, 
  onChange, 
  onSend, 
  onStop,
  disabled, 
  isLoading = false,
  isDarkMode,
  sidebarOpen = false,
  sidebarRef,
  onHeightChange,
  // Control buttons
  onVoiceInput,
  onClear,
  onAttachment,
  showVoiceButton = false,
  showClearButton = true,
  showAttachmentButton = false
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const translationContext = useTranslation();
  const { t } = translationContext;



  // Flag selection state with localStorage persistence
  const [selectedFlags, setSelectedFlags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selectedCountries');
      return saved ? JSON.parse(saved) : ['PS', 'LB', 'SA', 'IQ'];
    } catch {
      return ['PS', 'LB', 'SA', 'IQ'];
    }
  });
  const [flagAnchorEl, setFlagAnchorEl] = useState<HTMLElement | null>(null);
  const flagPopoverOpen = Boolean(flagAnchorEl);

  // Date range state with single localStorage key
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
  const datePopoverOpen = Boolean(dateAnchorEl);
  
  // Initialize date range settings from localStorage
  const initializeDateRangeSettings = () => {
    try {
      const saved = localStorage.getItem('dateRangeSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          activeTab: settings.activeTab || 0,
          committedTab: settings.committedTab || 0,
          customRange: {
            amount: settings.customRange?.amount || 7,
            type: settings.customRange?.type || 'days'
          },
          datePicker: {
            startDate: settings.datePicker?.startDate ? dayjs(settings.datePicker.startDate) : null,
            endDate: settings.datePicker?.endDate ? dayjs(settings.datePicker.endDate) : null
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load date range settings from localStorage:', error);
    }
    
    // Default settings
    const today = dayjs();
    const oneMonthAgo = today.subtract(1, 'month');
    return {
      activeTab: 0,
      committedTab: 0,
      customRange: {
        amount: 1,
        type: 'months'
      },
      datePicker: {
        startDate: oneMonthAgo,
        endDate: today
      }
    };
  };

  const initialSettings = React.useMemo(() => initializeDateRangeSettings(), []);
  const [dateRangeTab, setDateRangeTab] = useState(initialSettings.activeTab);
  const [rangeAmount, setRangeAmount] = useState(initialSettings.customRange.amount);
  const [rangeType, setRangeType] = useState(initialSettings.customRange.type);
  const [rangeTypeOpen, setRangeTypeOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    initialSettings.datePicker.startDate,
    initialSettings.datePicker.endDate
  ]);
  
  // Temporary state for date picker (only committed on Apply)
  const [tempDateRange, setTempDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    initialSettings.datePicker.startDate,
    initialSettings.datePicker.endDate
  ]);
  
  // Track which tab's values are currently committed/active for display
  const [committedTab, setCommittedTab] = useState(initialSettings.committedTab);

  // Tool toggles hook
  const { enabledTools, toggleTool, isToolEnabled } = useToolToggles();

  // Save selected flags to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('selectedCountries', JSON.stringify(selectedFlags));
      } catch (error) {
        console.warn('Failed to save selected countries to localStorage:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedFlags]);



  // Save all date range settings to single localStorage key with debouncing - Fixed to prevent infinite loops
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const dateRangeSettings = {
          activeTab: dateRangeTab,
          committedTab: committedTab,
          customRange: {
            amount: rangeAmount,
            type: rangeType
          },
          datePicker: {
            startDate: dateRange[0] ? dateRange[0].toISOString() : null,
            endDate: dateRange[1] ? dateRange[1].toISOString() : null
          }
        };
        localStorage.setItem('dateRangeSettings', JSON.stringify(dateRangeSettings));
      } catch (error) {
        console.warn('Failed to save date range settings to localStorage:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    dateRangeTab, 
    committedTab, 
    rangeAmount, 
    rangeType, 
    dateRange[0]?.toISOString(), 
    dateRange[1]?.toISOString()
  ]); // Use ISO strings to prevent dayjs object comparison issues

  // Animated placeholder - get examples from translation (fixed to prevent infinite loops)
  const examples = React.useMemo(() => {
    try {
      // Access the current translations directly
      const currentTranslations = (translationContext as any).translations?.[translationContext.currentLang];
      const examples = currentTranslations?.input?.examples;
      
      // Debug logging
      // console.log('🔍 Animation Debug:', {
      //   currentLang: translationContext.currentLang,
      //   hasTranslations: !!currentTranslations,
      //   hasExamples: !!examples,
      //   examplesLength: examples?.length || 0,
      //   firstExample: examples?.[0]
      // });
      
      // If no examples from translations, use fallback for testing
      if (!examples || !Array.isArray(examples) || examples.length === 0) {
        // console.log('⚠️ No examples found, using fallback');
        return [
          'What can you help me with?',
          'Explain quantum computing simply',
          'Write a creative short story',
          'Help me debug this code'
        ];
      }
      
      return examples;
    } catch (error) {
      console.error('❌ Error loading examples:', error);
      // Return fallback examples if there's an error
      return [
        'What can you help me with?',
        'Explain quantum computing simply',
        'Write a creative short story'
      ];
    }
  }, [translationContext.currentLang, translationContext.translations]); // Include both dependencies

  // Animated placeholder with optimized hook to prevent infinite loops
  const animatedPlaceholder = useAnimatedPlaceholder({
    examples,
    typingSpeed: 150, // Slower for easier debugging
    pauseDuration: 1500, // Shorter pause for faster testing
    deletingSpeed: 75,
    isActive: !value.trim() && examples.length > 0 // Show animation when input is empty and examples exist
  });

  // Debug the animated placeholder
  // React.useEffect(() => {
  //   console.log('🎬 Animated Placeholder Debug:', {
  //     examples: examples,
  //     examplesLength: examples.length,
  //     isActive: !value.trim() && examples.length > 0,
  //     animatedPlaceholder: animatedPlaceholder,
  //     value: value,
  //     valueLength: value.length
  //   });
  // }, [examples, animatedPlaceholder, value]);

  // Show debug info in placeholder for testing
  const debugPlaceholder = animatedPlaceholder  ?? ''

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Stable callback for height measurement - use ref to avoid dependency issues
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;

  // Stable callback for sidebar width update - use refs to avoid dependency issues
  const sidebarRefCurrent = useRef(sidebarRef);
  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarRefCurrent.current = sidebarRef;
  sidebarOpenRef.current = sidebarOpen;
  
  const updateSidebarWidth = useCallback(() => {
    if (sidebarRefCurrent.current?.current && sidebarOpenRef.current) {
      const width = sidebarRefCurrent.current.current.offsetWidth;
      setSidebarWidth(width);
    } else {
      setSidebarWidth(0);
    }
  }, []);

  // Auto-resize textarea - simplified to prevent infinite loops
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      
      // Measure height after resize
      if (inputContainerRef.current && onHeightChangeRef.current) {
        const height = inputContainerRef.current.offsetHeight;
        onHeightChangeRef.current(height);
      }
    }
  }, [value]);

  // Measure input area height on window resize only - fixed to prevent infinite loops
  useEffect(() => {
    const handleResize = () => {
      if (inputContainerRef.current && onHeightChangeRef.current) {
        const height = inputContainerRef.current.offsetHeight;
        onHeightChangeRef.current(height);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array - no dependencies needed

  // Measure sidebar width dynamically - simplified
  useEffect(() => {
    if (sidebarRefCurrent.current?.current && sidebarOpenRef.current) {
      const width = sidebarRefCurrent.current.current.offsetWidth;
      setSidebarWidth(width);
    } else {
      setSidebarWidth(0);
    }
  }, [sidebarOpen]); // Only depend on sidebarOpen, not the callback

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isLoading && onStop) {
      onStop();
    } else if (value.trim() && !disabled) {
      // Prepare date filter data
      const dateFilter: DateFilter = {
        type: committedTab === 1 ? 'picker' : 'custom',
        customRange: committedTab === 0 ? {
          amount: rangeAmount,
          type: rangeType
        } : undefined,
        dateRange: committedTab === 1 ? dateRange : undefined
      };
      
      // Prepare send data
      const sendData: SendMessageData = {
        content: value,
        dateFilter,
        selectedCountries: selectedFlags,
        enabledTools: Object.keys(enabledTools).filter(toolId => enabledTools[toolId])
      };
      
      onSend(sendData);
    }
  };

  const canSend = value.trim() && !disabled;
  const showStopButton = isLoading;
  
  // Detect text direction for proper alignment - simplified to prevent infinite loops
  const textDirection = React.useMemo(() => detectLanguage(value || ''), [value]);
  const placeholderDirection = 'ltr'; // Keep placeholder simple to avoid loops

  // Memoize textarea styles to prevent unnecessary re-renders
  const textareaStyle = React.useMemo(() => ({
    width: '100%',
    minHeight: '52px',
    maxHeight: '200px',
    padding: '16px',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    backgroundColor: 'transparent',
    color: isDarkMode ? '#ececf1' : '#374151',
    fontSize: '16px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.5',
    overflow: 'hidden' as const,
    fontWeight: '400',
    WebkitAppearance: 'none' as const,
    cursor: 'text' as const,
    direction: textDirection as 'ltr' | 'rtl',
    textAlign: textDirection === 'rtl' ? 'right' as const : 'left' as const,
    unicodeBidi: 'plaintext' as const,
    boxSizing: 'border-box' as const,
  }), [isDarkMode, textDirection]);

  // Flag selection handlers
  const handleFlagClick = (event: React.MouseEvent<HTMLElement>) => {
    if (flagPopoverOpen) {
      setFlagAnchorEl(null);
    } else {
      setFlagAnchorEl(event.currentTarget);
    }
  };

  const handleFlagToggle = (flagCode: string) => {
    const newFlags = selectedFlags.includes(flagCode) 
      ? selectedFlags.filter(code => code !== flagCode)
      : [...selectedFlags, flagCode];
    
    setSelectedFlags(newFlags);
  };

  // Date range handlers
  const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
    if (datePopoverOpen) {
      setDateAnchorEl(null);
    } else {
      // Sync temp state with current state when opening
      setTempDateRange(dateRange);
      setDateAnchorEl(event.currentTarget);
    }
  };

  const handleDateRangeApply = () => {
    // Commit temporary date range to main state
    if (dateRangeTab === 1) {
      setDateRange(tempDateRange);
    }
    // Update committed tab to current tab
    setCommittedTab(dateRangeTab);
    setDateAnchorEl(null);
  };

  // Format date range for button display
  const getDateRangeButtonText = () => {
    if (committedTab === 1 && dateRange[0] && dateRange[1]) {
      // DateTime picker format - use committed dateRange
      const start = dateRange[0].format('DD/MM HH:mm');
      const end = dateRange[1].format('DD/MM HH:mm');
      return `${start} - ${end}`;
    } else {
      // Custom range format
      return `${rangeAmount} ${t(`dateRange.${rangeType}`)} ${t('dateRange.ago')}`;
    }
  };

  const handleDateRangeReset = () => {
    // Reset to default values
    setRangeAmount(1);
    setRangeType('months');
    // Reset date range to default: one month ago to today
    const today = dayjs();
    const oneMonthAgo = today.subtract(1, 'month');
    setDateRange([oneMonthAgo, today]);
    setTempDateRange([null, null]); // Reset temp state to empty for date picker
    setDateRangeTab(0); // Switch back to custom range tab
    setCommittedTab(0); // Reset committed tab to custom range
    
    // Clear the BasicDateRangePicker's localStorage data
    try {
      localStorage.removeItem('dateRangePicker');
      console.log('Cleared date picker localStorage on reset');
    } catch (error) {
      console.warn('Failed to clear date picker localStorage:', error);
    }
  };

  // Tool toggle handler
  const handleToolToggle = (toolId: string) => {
    toggleTool(toolId);
  };

  return (
    <>
      {/* Sticky Bottom Container */}
      <Box
        ref={inputContainerRef}
        sx={{
          position: 'fixed',
          bottom: 0,
          insetInlineStart: sidebarWidth > 0 ? `${sidebarWidth}px` : '0',
          insetInlineEnd: 0,
          zIndex: 10,
          background: isDarkMode 
            ? 'linear-gradient(180deg, rgba(52, 53, 65, 0) 0%, rgba(52, 53, 65, 0.8) 50%, #343541 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, #ffffff 100%)',
          paddingTop: '20px',
          paddingBottom: '20px',
          // Removed transition to prevent animation when sidebar opens/closes
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
            paddingInlineStart: '20px',
            paddingInlineEnd: '20px',
            '@media (max-width: 600px)': {
              paddingInlineStart: '10px',
              paddingInlineEnd: '10px',
            }
          }}
        >

                    {/* Main Input Container - Vertical Flex Layout */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              backgroundColor: isDarkMode ? '#40414f' : '#f7f7f8',
              border: isFocused 
                ? `1px solid ${isDarkMode ? '#565869' : '#d1d5db'}` 
                : `1px solid ${isDarkMode ? '#565869' : '#d1d5db'}`,
              boxShadow: isFocused
                ? `0 0 0 2px ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                : '0 2px 6px rgba(0, 0, 0, 0.05)',
              // Removed transition to prevent flickering during typing
              direction: textDirection, // Set container direction based on text
              minHeight: '80px',
              '&:hover': {
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
              },
              // Placeholder styling - simplified to prevent loops
              '& textarea::placeholder': {
                opacity: 0.7,
                textAlign: 'left',
                direction: 'ltr',
              },
              '& textarea::-webkit-input-placeholder': {
                opacity: 0.7,
                textAlign: 'left',
                direction: 'ltr',
              },
              '& textarea::-moz-placeholder': {
                opacity: 0.7,
                textAlign: 'left',
                direction: 'ltr',
              },
              '& textarea:-ms-input-placeholder': {
                opacity: 0.7,
                textAlign: 'left',
                direction: 'ltr',
              }
            }}
          >
            {/* Textarea - First Row */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={debugPlaceholder}
              disabled={disabled}
              style={textareaStyle}
            />

            {/* Control Buttons Row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px 16px 16px',
                gap: '12px',
              }}
            >
              {/* Left Control Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                {/* Multi-Select Flag Dropdown */}
                <Box
                  onClick={handleFlagClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isDarkMode ? '#565869' : '#e5e7eb',
                    border: `1px solid ${isDarkMode ? '#6b6d7a' : '#d1d5db'}`,
                    borderRadius: '20px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '120px',
                    height: '32px',
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#6b6d7a' : '#d1d5db',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  {/* Selected Flags Display */}
                  <Box sx={{ 
                    display: 'flex', 
                    flex: 1, 
                    alignItems: 'center',
                    position: 'relative',
                    minWidth: '80px',
                    height: '24px',
                  }}>
                    {selectedFlags.length === 0 ? (
                      // No countries selected - show placeholder
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          fontWeight: 400,
                          direction: 'rtl',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t('input.selectCountries')}
                      </Typography>
                    ) : (
                      <>
                        {selectedFlags.slice(0, 4).map((flagCode, index) => {
                          const flagOption = flagOptions.find(opt => opt.code === flagCode);
                          return flagOption ? (
                            <Box
                              key={flagCode}
                              sx={{
                                position: 'absolute',
                                left: `${index * 14}px`,
                                fontSize: '14px',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                zIndex: selectedFlags.length - index,
                                pointerEvents: 'none',
                              }}
                            >
                              {flagOption.flag}
                            </Box>
                          ) : null;
                        })}
                        {selectedFlags.length > 4 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${4 * 14}px`,
                              fontSize: '10px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isDarkMode ? '#565869' : '#e5e7eb',
                              border: '2px solid #ffffff',
                              color: isDarkMode ? '#ececf1' : '#374151',
                              fontWeight: 700,
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                              zIndex: 1,
                            }}
                          >
                            +{selectedFlags.length - 4}
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                  
                  {/* Dropdown Arrow */}
                  <ExpandMoreIcon 
                    sx={{ 
                      fontSize: '14px',
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      transition: 'transform 0.2s ease',
                      transform: flagPopoverOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }} 
                  />
                </Box>

                {/* Date Selector */}
                <Box
                  onClick={handleDateClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isDarkMode ? '#565869' : '#e5e7eb',
                    border: `1px solid ${isDarkMode ? '#6b6d7a' : '#d1d5db'}`,
                    borderRadius: '20px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#6b6d7a' : '#d1d5db',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <CalendarIcon 
                    sx={{ 
                      fontSize: '16px',
                      color: isDarkMode ? '#ececf1' : '#374151',
                    }} 
                  />
                  <Typography 
                    sx={{ 
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isDarkMode ? '#ececf1' : '#374151',
                      direction: 'inherit',
                      textAlign: 'start',
                      whiteSpace: 'nowrap',
                      unicodeBidi: 'plaintext', // Let text determine its own direction
                    }}
                  >
                    {getDateRangeButtonText()}
                  </Typography>
                </Box>

                {/* Settings Button */}
                <IconButton
                  sx={{
                    backgroundColor: isDarkMode ? '#565869' : '#e5e7eb',
                    border: `1px solid ${isDarkMode ? '#6b6d7a' : '#d1d5db'}`,
                    borderRadius: '20px',
                    width: '36px',
                    height: '36px',
                    color: isDarkMode ? '#ececf1' : '#374151',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#6b6d7a' : '#d1d5db',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <SettingsIcon sx={{ fontSize: '18px' }} />
                </IconButton>
              </Box>

              {/* Right Control Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                {/* Tools List */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: '6px', 
                  alignItems: 'center',
                }}>
                  {toolsList.map((tool) => {
                    const isEnabled = enabledTools[tool.id];
                    return (
                      <Box
                        key={tool.id}
                        component="button"
                        onClick={() => handleToolToggle(tool.id)}
                        sx={{
                          backgroundColor: isEnabled 
                            ? (isDarkMode ? '#2563eb' : '#3b82f6')
                            : 'transparent',
                          border: `1px solid ${
                            isEnabled 
                              ? (isDarkMode ? '#2563eb' : '#3b82f6')
                              : (isDarkMode ? '#565869' : '#d1d5db')
                          }`,
                          borderRadius: '20px',
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: isEnabled 
                            ? '#ffffff' 
                            : (isDarkMode ? '#ececf1' : '#374151'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          direction: 'rtl',
                          fontFamily: 'inherit',
                          '&:hover': {
                            backgroundColor: isEnabled
                              ? (isDarkMode ? '#1d4ed8' : '#2563eb')
                              : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                            borderColor: isEnabled
                              ? (isDarkMode ? '#1d4ed8' : '#2563eb')
                              : (isDarkMode ? '#6b6d7a' : '#b8bcc4'),
                            transform: 'translateY(-1px)',
                            boxShadow: isEnabled 
                              ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                              : 'none',
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                        }}
                      >
                        {t(tool.nameKey)}
                      </Box>
                    );
                  })}
                </Box>

                {/* Additional Control Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: '4px', 
                  alignItems: 'center',
                }}>
                  {/* Clear Button */}
                  {showClearButton && value.trim() && (
                    <IconButton
                      onClick={() => {
                        onChange('');
                        onClear?.();
                      }}
                      disabled={disabled}
                      sx={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#8e8ea0' : '#6b7280',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          color: isDarkMode ? '#ffffff' : '#374151',
                        },
                      }}
                      title={t('input.clear') || 'Clear'}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}

                  {/* Voice Button */}
                  {showVoiceButton && (
                    <IconButton
                      onClick={onVoiceInput}
                      disabled={disabled}
                      sx={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#8e8ea0' : '#6b7280',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          color: isDarkMode ? '#ffffff' : '#374151',
                        },
                      }}
                      title={t('input.voice') || 'Voice input'}
                    >
                      <MicIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}

                  {/* Attachment Button */}
                  {showAttachmentButton && (
                    <IconButton
                      onClick={onAttachment}
                      disabled={disabled}
                      sx={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#8e8ea0' : '#6b7280',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          color: isDarkMode ? '#ffffff' : '#374151',
                        },
                      }}
                      title={t('input.attachment') || 'Attach file'}
                    >
                      <AttachFileIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>

            {/* Submit/Stop Button */}
            <IconButton
              onClick={handleSubmit}
              disabled={!canSend && !showStopButton}
              sx={{
                width: '32px',
                height: '32px',
                backgroundColor: showStopButton 
                  ? (isDarkMode ? '#565869' : '#f3f4f6')
                  : canSend 
                    ? '#000000'
                    : (isDarkMode ? '#40414f' : '#f7f7f8'),
                color: showStopButton
                  ? (isDarkMode ? '#ffffff' : '#374151')
                  : canSend 
                    ? '#ffffff'
                    : (isDarkMode ? '#6b7280' : '#9ca3af'),
                borderRadius: '50%',
                border: 'none',
                boxShadow: 'none',
                minWidth: 'auto',
                padding: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: showStopButton
                    ? (isDarkMode ? '#6b7280' : '#e5e7eb')
                    : canSend 
                      ? '#333333'
                      : (isDarkMode ? '#4a4b57' : '#eeeeee'),
                  transform: canSend || showStopButton ? 'scale(1.1)' : 'none',
                  boxShadow: canSend || showStopButton ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                },
                '&:disabled': {
                  backgroundColor: isDarkMode ? '#40414f' : '#f7f7f8',
                  color: isDarkMode ? '#6b7280' : '#9ca3af',
                  transform: 'none',
                  boxShadow: 'none',
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: canSend ? '0 0 0 2px rgba(0, 0, 0, 0.2)' : 'none',
                },
              }}
            >
              {showStopButton ? (
                <StopIcon sx={{ fontSize: 18 }} />
              ) : (
                <ArrowUpIcon sx={{ fontSize: 20, fontWeight: 'bold' }} />
              )}
            </IconButton>
              </Box>
            </Box>

            {/* Flag Multi-Select Dropdown */}
            {flagPopoverOpen && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  backgroundColor: 'transparent',
                }}
                onClick={() => {
                  setFlagAnchorEl(null);
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: flagAnchorEl ? window.innerHeight - flagAnchorEl.getBoundingClientRect().top + 8 : 0,
                    left: flagAnchorEl ? flagAnchorEl.getBoundingClientRect().left : 0,
                    backgroundColor: isDarkMode ? '#40414f' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#565869' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    boxShadow: isDarkMode 
                      ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 25px rgba(0, 0, 0, 0.15)',
                    padding: '16px',
                    maxWidth: '400px',
                    zIndex: 9999,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      maxWidth: '280px',
                    }}
                  >
                    {flagOptions.map((option) => (
                      <Box
                        key={option.code}
                        onClick={() => {
                          handleFlagToggle(option.code);
                        }}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '12px 8px',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          backgroundColor: selectedFlags.includes(option.code) 
                            ? (isDarkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)')
                            : 'transparent',
                          border: selectedFlags.includes(option.code)
                            ? '2px solid #2196f3'
                            : '2px solid transparent',
                          '&:hover': {
                            backgroundColor: selectedFlags.includes(option.code)
                              ? (isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.15)')
                              : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            fontSize: '24px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {option.flag}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '11px',
                            color: selectedFlags.includes(option.code)
                              ? '#2196f3'
                              : (isDarkMode ? '#ececf1' : '#374151'),
                            direction: 'rtl',
                            fontWeight: selectedFlags.includes(option.code) ? 600 : 400,
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          {t(option.nameKey)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Date Range Popover */}
            {datePopoverOpen && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
                onClick={() => {
                  setDateAnchorEl(null);
                  setRangeTypeOpen(false);
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: dateAnchorEl ? window.innerHeight - dateAnchorEl.getBoundingClientRect().top + 8 : 0,
                    left: dateAnchorEl ? dateAnchorEl.getBoundingClientRect().left : 0,
                    backgroundColor: isDarkMode ? '#2f2f2f' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#4a4a4a' : '#e1e5e9'}`,
                    borderRadius: '8px',
                    boxShadow: isDarkMode 
                      ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                      : '0 4px 20px rgba(0, 0, 0, 0.1)',
                    padding: '0',
                    minWidth: '500px',
                    maxWidth: '600px',
                    zIndex: 9999,
                    overflow: 'hidden',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {/* Tabs */}
                  <Box
                    sx={{
                      display: 'flex',
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                      borderRadius: '6px',
                      padding: '4px',
                      margin: '16px 16px 0 16px',
                      gap: '4px',
                    }}
                  >
                    <Box
                      onClick={() => setDateRangeTab(0)}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: dateRangeTab === 0 
                          ? (isDarkMode ? '#ffffff' : '#ffffff')
                          : 'transparent',
                        color: dateRangeTab === 0
                          ? (isDarkMode ? '#000000' : '#000000')
                          : (isDarkMode ? '#a0a0a0' : '#6b7280'),
                        boxShadow: dateRangeTab === 0 
                          ? '0 1px 3px rgba(0, 0, 0, 0.12)' 
                          : 'none',
                        '&:hover': {
                          backgroundColor: dateRangeTab === 0 
                            ? (isDarkMode ? '#ffffff' : '#ffffff')
                            : (isDarkMode ? '#2a2a2a' : '#f1f3f4'),
                        },
                      }}
                    >
                      {t('dateRange.customRange')}
                    </Box>
                    <Box
                      onClick={() => setDateRangeTab(1)}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: dateRangeTab === 1 
                          ? (isDarkMode ? '#ffffff' : '#ffffff')
                          : 'transparent',
                        color: dateRangeTab === 1
                          ? (isDarkMode ? '#000000' : '#000000')
                          : (isDarkMode ? '#a0a0a0' : '#6b7280'),
                        boxShadow: dateRangeTab === 1 
                          ? '0 1px 3px rgba(0, 0, 0, 0.12)' 
                          : 'none',
                        '&:hover': {
                          backgroundColor: dateRangeTab === 1 
                            ? (isDarkMode ? '#ffffff' : '#ffffff')
                            : (isDarkMode ? '#2a2a2a' : '#f1f3f4'),
                        },
                      }}
                    >
                      {t('dateRange.datePicker')}
                    </Box>
                  </Box>

                  {/* Tab Content */}
                  <Box sx={{ padding: '16px' }}>
                    {dateRangeTab === 0 ? (
                      // Custom Range Tab
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Typography
                          sx={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: isDarkMode ? '#f1f1f1' : '#1f2937',
                            marginBottom: '4px',
                            direction: 'inherit',
                            textAlign: 'start',
                          }}
                        >
                          {t('dateRange.customRangeTitle')}
                        </Typography>
                        
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            gap: '8px', 
                            alignItems: 'center',
                            direction: 'ltr', // Force LTR for number input and dropdown alignment
                            flexDirection: 'row'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TextField
                            type="number"
                            value={rangeAmount}
                            onChange={(e) => setRangeAmount(Math.max(1, Math.min(100000, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: 100000 }}
                            size="small"
                            sx={{
                              width: '100px',
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isDarkMode ? '#404040' : '#f8f9fa',
                                borderRadius: '6px',
                                color: isDarkMode ? '#f1f1f1' : '#1f2937',
                                fontSize: '14px',
                                '& fieldset': {
                                  borderColor: isDarkMode ? '#555555' : '#e1e5e9',
                                },
                                '&:hover fieldset': {
                                  borderColor: isDarkMode ? '#666666' : '#c1c7cd',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#10a37f',
                                  borderWidth: '1px',
                                },
                              },
                            }}
                          />
                          
                          <Box sx={{ position: 'relative', minWidth: '120px' }}>
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                setRangeTypeOpen(!rangeTypeOpen);
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                border: `1px solid ${isDarkMode ? '#555555' : '#e1e5e9'}`,
                                borderRadius: '6px',
                                backgroundColor: isDarkMode ? '#404040' : '#f8f9fa',
                                color: isDarkMode ? '#f1f1f1' : '#1f2937',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: isDarkMode ? '#666666' : '#c1c7cd',
                                },
                              }}
                            >
                              <Typography sx={{ fontSize: '14px' }}>
                                {t(`dateRange.${rangeType}`)}
                              </Typography>
                              <ExpandMoreIcon 
                                sx={{ 
                                  fontSize: '18px',
                                  transform: rangeTypeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                }} 
                              />
                            </Box>
                            
                            {rangeTypeOpen && (
                              <Box
                                sx={{
                                  position: 'fixed',
                                  top: rangeTypeOpen ? 'auto' : '100%',
                                  bottom: rangeTypeOpen ? '50px' : 'auto',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '140px',
                                  zIndex: 10010,
                                  backgroundColor: isDarkMode ? '#2f2f2f' : '#ffffff',
                                  border: `1px solid ${isDarkMode ? '#4a4a4a' : '#e1e5e9'}`,
                                  borderRadius: '8px',
                                  boxShadow: isDarkMode 
                                    ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
                                    : '0 8px 25px rgba(0, 0, 0, 0.15)',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                }}
                              >
                                {timeRangeOptions.map((option) => (
                                  <Box
                                    key={option.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRangeType(option.value);
                                      setRangeTypeOpen(false);
                                    }}
                                    sx={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      color: isDarkMode ? '#f1f1f1' : '#1f2937',
                                      backgroundColor: rangeType === option.value 
                                        ? (isDarkMode ? '#404040' : '#f3f4f6')
                                        : 'transparent',
                                      borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#f0f0f0'}`,
                                      '&:last-child': {
                                        borderBottom: 'none',
                                      },
                                      '&:hover': {
                                        backgroundColor: isDarkMode ? '#404040' : '#f3f4f6',
                                      },
                                      '&:first-of-type': {
                                        borderTopLeftRadius: '8px',
                                        borderTopRightRadius: '8px',
                                      },
                                      '&:last-of-type': {
                                        borderBottomLeftRadius: '8px',
                                        borderBottomRightRadius: '8px',
                                      },
                                    }}
                                  >
                                    {t(option.labelKey)}
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                          
                          <Typography
                            sx={{
                              fontSize: '14px',
                              color: isDarkMode ? '#a0a0a0' : '#6b7280',
                              whiteSpace: 'nowrap',
                              direction: 'inherit', // Inherit direction from parent context
                              textAlign: 'start',
                            }}
                          >
                            {t('dateRange.ago')}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      // Date Picker Tab
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Typography
                          sx={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: isDarkMode ? '#f1f1f1' : '#1f2937',
                            marginBottom: '4px',
                            direction: 'inherit',
                            textAlign: 'start',
                          }}
                        >
                          {t('dateRange.datePickerTitle')}
                        </Typography>
                        
                        <BasicDateRangePicker
                          value={tempDateRange}
                          onChange={setTempDateRange}
                          isDarkMode={isDarkMode}
                          startLabel={t('dateRange.startDate')}
                          endLabel={t('dateRange.endDate')}
                        />
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}` }}>
                      <Button
                        onClick={handleDateRangeReset}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: isDarkMode ? '#555555' : '#d1d5db',
                          color: isDarkMode ? '#f1f1f1' : '#374151',
                          fontSize: '13px',
                          fontWeight: 500,
                          textTransform: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          boxShadow: 'none',
                          '&:hover': {
                            borderColor: isDarkMode ? '#666666' : '#9ca3af',
                            backgroundColor: isDarkMode ? '#404040' : '#f9fafb',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        {t('dateRange.reset')}
                      </Button>
                      <Button
                        onClick={handleDateRangeApply}
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: '#10a37f',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: 500,
                          textTransform: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          boxShadow: 'none',
                          '&:hover': {
                            backgroundColor: '#0d8b70',
                            boxShadow: 'none',
                          },
                          '&:active': {
                            backgroundColor: '#0b7a63',
                          },
                        }}
                      >
                        {t('dateRange.apply')}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}


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