import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Api as ApiIcon,
  Psychology as MockIcon,
} from '@mui/icons-material';
import { type Message } from '@iagent/stream-mocks';
import { MarkdownRenderer } from './MarkdownRenderer';
import { extractPlainTextFromMarkdown, copyToClipboard } from '../utils/textUtils';
import { useTranslation } from '../contexts/TranslationContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
  onRefreshMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string, content: string) => void;
}

// Shared Header Component
const ChatHeader = ({ 
  onToggleSidebar, 
  isDarkMode, 
  onToggleTheme, 
  useMockMode, 
  onToggleMockMode 
}: {
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '64px',
      alignItems: 'center',
      gap: '8px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: '0 16px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: theme.palette.background.default,
    }}>
      <IconButton 
        onClick={onToggleSidebar}
        sx={{ 
          color: theme.palette.text.secondary,
          borderRadius: '6px',
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      
      <Box sx={{ width: '1px', height: '16px', backgroundColor: theme.palette.divider, marginInlineEnd: '8px' }} />
      
      <Typography variant="h6" sx={{ 
        color: theme.palette.text.primary,
        fontWeight: 600,
        fontSize: '16px',
      }}>
        {t('message.assistant')}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* Language Switcher */}
      <Box sx={{ marginInlineEnd: '8px' }}>
        <LanguageSwitcher isDarkMode={isDarkMode} />
      </Box>

      {/* Mock Mode Toggle */}
      <Tooltip title={useMockMode ? t('common.disableMockApi') : t('common.enableMockApi')}>
        <Chip
          icon={useMockMode ? <MockIcon /> : <ApiIcon />}
          label={useMockMode ? t('common.mockApi') : 'API'}
          onClick={onToggleMockMode}
          size="small"
          variant={useMockMode ? "filled" : "outlined"}
          sx={{
            marginInlineEnd: '8px',
            height: '28px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: useMockMode ? theme.palette.warning.main : 'transparent',
            color: useMockMode ? theme.palette.warning.contrastText : theme.palette.text.secondary,
            borderColor: useMockMode ? theme.palette.warning.main : theme.palette.divider,
            '&:hover': {
              backgroundColor: useMockMode ? theme.palette.warning.dark : theme.palette.action.hover,
              borderColor: useMockMode ? theme.palette.warning.dark : theme.palette.text.secondary,
            },
            '& .MuiChip-icon': {
              fontSize: '14px',
              color: 'inherit',
            },
          }}
        />
      </Tooltip>

      <IconButton 
        onClick={onToggleTheme}
        sx={{ 
          color: theme.palette.text.primary,
          borderRadius: '6px',
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.primary.main,
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Box>
  );
};

// iagent-inspired Message Component - Clean, grid-based layout with comprehensive action buttons
const MessageBubble = ({ message, isDarkMode, theme, onRefreshMessage, onEditMessage, onDeleteMessage, onShareMessage }: { 
  message: Message; 
  isDarkMode: boolean; 
  theme: any;
  onRefreshMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string, content: string) => void;
}) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const [liked, setLiked] = React.useState<boolean | null>(null);

  const handleCopy = async () => {
    try {
      // Extract plain text from markdown for better copying experience
      const plainText = extractPlainTextFromMarkdown(message.content);
      const success = await copyToClipboard(plainText);
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleRefresh = () => {
    if (onRefreshMessage) {
      onRefreshMessage(message.id);
    }
  };

  const handleEdit = () => {
    if (onEditMessage) {
      onEditMessage(message.id);
    }
  };

  const handleLike = () => {
    setLiked(liked === true ? null : true);
    console.log(`${liked === true ? 'Removed like' : 'Liked'} message:`, message.id);
  };

  const handleDislike = () => {
    setLiked(liked === false ? null : false);
    console.log(`${liked === false ? 'Removed dislike' : 'Disliked'} message:`, message.id);
  };

  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
    }
    console.log('Delete message:', message.id);
  };

  const handleShare = async () => {
    const plainText = extractPlainTextFromMarkdown(message.content);
    
    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('chat.shareTitle'),
          text: plainText,
        });
      } catch (error) {
        // Fallback to copy if share is cancelled or fails
        await handleCopy();
      }
    } else {
      // Fallback to copy if Web Share API is not available
      await handleCopy();
    }
    
    if (onShareMessage) {
      onShareMessage(message.id, plainText);
    }
    console.log('Share message:', message.id);
  };

  const handleMoreActions = () => {
    // TODO: Implement more actions menu (pin, forward, etc.)
    console.log('More actions for message:', message.id);
  };

  if (isUser) {
    // User Message - Right-aligned with muted background
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(72px, 1fr) auto',
          gridTemplateRows: 'auto auto',
                        gap: '8px',
              width: '100%',
              py: 2,
              animation: 'messageSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes messageSlideIn': {
                '0%': { opacity: 0, transform: 'translateY(4px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
          '&:hover .user-action-bar': {
            opacity: 1,
          },
        }}
      >
        {/* User message bubble */}
        <Box
          className="message-container"
          sx={{
                          gridColumn: '2',
              gridRow: '1',
              backgroundColor: isDarkMode ? '#404040' : '#f3f4f6',
              color: theme.palette.text.primary,
              borderRadius: '24px',
            padding: '10px 20px',
            wordBreak: 'break-word',
            fontSize: '16px',
            lineHeight: 1.7,
          }}
        >
          <MarkdownRenderer 
            content={message.content}
            isDarkMode={isDarkMode}
          />
          
          {message.isStreaming && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                // backgroundColor: theme.palette.primary.main,
                marginInlineStart: '4px',
                borderRadius: '1px',
                animation: 'typingBlink 1s infinite',
                '@keyframes typingBlink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0.3 },
                },
              }}
            />
          )}
        </Box>

        {/* User action bar */}
        <Box
          className="user-action-bar"
          sx={{
                          gridColumn: '2',
              gridRow: '2',
              display: 'flex',
              gap: '4px',
              marginTop: '8px',
              opacity: 0,
              transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          <Tooltip title={copied ? t('message.copied') : t('message.copy')}>
            <IconButton
              onClick={handleCopy}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: copied ? theme.palette.success.main : theme.palette.text.secondary,
                borderRadius: '6px',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: copied ? theme.palette.success.main : theme.palette.text.primary,
                },
              }}
            >
              {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t('message.edit')}>
            <IconButton
              onClick={handleEdit}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: '6px',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('message.refresh')}>
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: '6px',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <RefreshIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  // Assistant Message - Left-aligned, clean layout
  return (
    <Box
      sx={{
                    display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gridTemplateRows: 'auto auto',
            position: 'relative',
            width: '100%',
            py: 2,
            animation: 'messageSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes messageSlideIn': {
              '0%': { opacity: 0, transform: 'translateY(4px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
        '&:hover .assistant-action-bar': {
          opacity: 1,
        },
        '@media (hover: none)': {
          '& .assistant-action-bar': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Assistant message content */}
      <Box
        className="message-container"
        sx={{
                        gridColumn: '1 / -1',
              gridRow: '1',
              color: theme.palette.text.primary,
              wordBreak: 'break-word',
              lineHeight: 1.7,
              fontSize: '16px',
              margin: '6px 0',
              padding: '10px 20px',
              borderRadius: '24px',
        }}
      >
        <MarkdownRenderer 
          content={message.content}
          isDarkMode={isDarkMode}
        />
        
        {message.isStreaming && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              backgroundColor: theme.palette.primary.main,
              marginInlineStart: '4px',
              borderRadius: '1px',
              animation: 'typingBlink 1s infinite',
              '@keyframes typingBlink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0.3 },
              },
            }}
          />
        )}
      </Box>

      {/* Assistant action bar */}
      <Box
        className="assistant-action-bar"
        sx={{
          gridColumn: '1 / -1',
          gridRow: '2',
          display: 'flex',
          gap: '4px',
          marginTop: '8px',
          marginBottom: '8px',
          opacity: 0,
          position: 'relative',
          zIndex: 10,
          transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        {/* Copy Button */}
        <Tooltip title={copied ? t('message.copied') : t('message.copy')}>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: copied ? theme.palette.success.main : theme.palette.text.secondary,
              borderRadius: '6px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: copied ? theme.palette.success.main : theme.palette.text.primary,
              },
            }}
          >
            {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>

        {/* Like Button */}
        <Tooltip title={liked === true ? t('message.removeLike') : t('message.goodResponse')}>
          <IconButton
            onClick={handleLike}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: liked === true ? theme.palette.success.main : theme.palette.text.secondary,
              borderRadius: '6px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: liked === true ? theme.palette.success.main : theme.palette.text.primary,
              },
            }}
          >
            <ThumbUpIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>

        {/* Dislike Button */}
        <Tooltip title={liked === false ? t('message.removeDislike') : t('message.badResponse')}>
          <IconButton
            onClick={handleDislike}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: liked === false ? theme.palette.error.main : theme.palette.text.secondary,
              borderRadius: '6px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: liked === false ? theme.palette.error.main : theme.palette.text.primary,
              },
            }}
          >
            <ThumbDownIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        
        {/* Regenerate Response Button */}
        {!message.isStreaming && (
          <Tooltip title={t('message.regenerateResponse')}>
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: '6px',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <RefreshIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Metadata */}
      {message.metadata && (
        <Typography 
          variant="body2" 
          sx={{ 
            gridColumn: '2 / 4',
            gridRow: '3',
            color: theme.palette.text.secondary,
            fontSize: '12px',
            marginTop: '4px',
            opacity: 0.7,
          }}
        >
          {message.metadata.timestamp && new Date(message.metadata.timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  );
};

// Loading Indicator - Clean, minimal
const TypingIndicator = ({ isDarkMode, theme }: { isDarkMode: boolean; theme: any }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: theme.palette.text.secondary,
        py: 2,
      }}
    >
      <BotIcon sx={{ fontSize: 20 }} />
      <Typography variant="body2">{t('chat.thinking')}</Typography>
    </Box>
  );
};

// Welcome Screen - Clean, centered
const WelcomeScreen = ({ isDarkMode, theme, onToggleSidebar, onToggleTheme, useMockMode, onToggleMockMode }: {
  isDarkMode: boolean;
  theme: any;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        boxSizing: 'border-box',
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <ChatHeader 
        onToggleSidebar={onToggleSidebar}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        useMockMode={useMockMode}
        onToggleMockMode={onToggleMockMode}
      />

      {/* Welcome Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: '24px',
          p: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            color: theme.palette.text.primary,
          }}
        >
          {t('chat.welcome.title')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}
          >
            {t('chat.welcome.subtitle')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}
          >
            {t('chat.welcome.description')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export function ChatArea({ messages, isLoading, onToggleSidebar, isDarkMode, onToggleTheme, useMockMode, onToggleMockMode, onRefreshMessage, onEditMessage, onDeleteMessage, onShareMessage }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <WelcomeScreen 
        isDarkMode={isDarkMode}
        theme={theme}
        onToggleSidebar={onToggleSidebar}
        onToggleTheme={onToggleTheme}
        useMockMode={useMockMode}
        onToggleMockMode={onToggleMockMode}
      />
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        boxSizing: 'border-box',
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <ChatHeader 
        onToggleSidebar={onToggleSidebar}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        useMockMode={useMockMode}
        onToggleMockMode={onToggleMockMode}
      />

      {/* Messages Container */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          scrollBehavior: 'smooth',
          backgroundColor: 'inherit',
          padding: '32px 16px',
          paddingBottom: {
            xs: '120px',
            sm: '80px'
          },
          '@media (max-width: 600px)': {
            WebkitOverflowScrolling: 'touch',
            padding: '16px 8px',
          }
        }}
      >
        {/* Messages */}
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isDarkMode={isDarkMode}
            theme={theme}
            onRefreshMessage={onRefreshMessage}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onShareMessage={onShareMessage}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && !messages.some(m => m.isStreaming) && (
          <TypingIndicator isDarkMode={isDarkMode} theme={theme} />
        )}

        {/* Spacer */}
        <Box sx={{ minHeight: '32px', flexGrow: 1 }} />

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>
    </Box>
  );
} 