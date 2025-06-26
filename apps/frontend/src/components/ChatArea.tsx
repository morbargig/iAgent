import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
  Chip,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Login as LoginIcon,
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
  Person as PersonIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
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
  inputAreaHeight?: number; // Add input area height prop
  onLogout?: () => void;
  userEmail?: string | null;
}

// Shared Header Component
const ChatHeader = ({ 
  onToggleSidebar, 
  isDarkMode, 
  onToggleTheme, 
  useMockMode, 
  onToggleMockMode,
  onLogout,
  userEmail
}: {
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

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
        aria-label={t('sidebar.toggle')}
        sx={{ 
          color: theme.palette.text.secondary,
          borderRadius: '6px',
          minWidth: '44px',
          minHeight: '44px',
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

      {/* Mock Mode Toggle - ChatGPT Style */}
      <Tooltip title={useMockMode ? t('common.disableMockApi') : t('common.enableMockApi')}>
        <IconButton
          onClick={onToggleMockMode}
          className="no-rtl-transform"
          aria-label={useMockMode ? t('common.disableMockApi') : t('common.enableMockApi')}
          sx={{
            marginInlineEnd: '8px',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: useMockMode 
              ? (isDarkMode ? 'rgba(52, 53, 65, 1)' : 'rgba(0, 0, 0, 0.05)')
              : 'transparent',
            color: useMockMode 
              ? theme.palette.primary.main 
              : theme.palette.text.secondary,
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: useMockMode 
                ? (isDarkMode ? 'rgba(52, 53, 65, 0.8)' : 'rgba(0, 0, 0, 0.08)')
                : theme.palette.action.hover,
              borderColor: useMockMode 
                ? theme.palette.primary.main 
                : theme.palette.text.secondary,
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          {useMockMode ? (
            <MockIcon sx={{ fontSize: '18px' }} />
          ) : (
            <ApiIcon sx={{ fontSize: '18px' }} />
          )}
        </IconButton>
      </Tooltip>

      <IconButton 
        onClick={onToggleTheme}
        className="no-rtl-transform"
        aria-label={isDarkMode ? t('theme.light') : t('theme.dark')}
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
        {isDarkMode ? <LightModeIcon sx={{ fontSize: '18px' }} /> : <DarkModeIcon sx={{ fontSize: '18px' }} />}
      </IconButton>

      {/* User Menu */}
      {userEmail && (
        <>
          <Box sx={{ width: '1px', height: '16px', backgroundColor: theme.palette.divider, marginInline: '8px' }} />
          <Tooltip title={t('user.menu')}>
            <IconButton
              onClick={handleUserMenuOpen}
              className="no-rtl-transform"
              aria-label="User menu"
              sx={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: userMenuAnchor ? theme.palette.action.selected : 'transparent',
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
              <PersonIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
          
          {/* User Menu Popover */}
          <Popover
            open={Boolean(userMenuAnchor)}
            anchorEl={userMenuAnchor}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPaper-root': {
                mt: 1,
                minWidth: 200,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isDarkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                  : '0 8px 32px rgba(0, 0, 0, 0.12)',
                backgroundColor: theme.palette.background.paper,
              }
            }}
          >
            <List sx={{ padding: '8px' }}>
              {/* User Info Section */}
              <ListItem sx={{ padding: '12px 16px' }}>
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: theme.palette.primary.main,
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {userEmail.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={userEmail}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    noWrap: true,
                  }}
                  secondary="Signed in"
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: theme.palette.text.secondary,
                  }}
                />
              </ListItem>
              
              <Divider sx={{ margin: '4px 8px' }} />
              
              {/* Logout Option */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    borderRadius: '8px',
                    margin: '0 4px',
                    padding: '8px 12px',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    <LogoutIcon sx={{ 
                      fontSize: '18px', 
                      color: theme.palette.error.main 
                    }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('auth.logout')}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: theme.palette.error.main,
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Popover>
        </>
      )}
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
    // console.log(`${liked === true ? 'Removed like' : 'Liked'} message:`, message.id);
  };

  const handleDislike = () => {
    setLiked(liked === false ? null : false);
    // console.log(`${liked === false ? 'Removed dislike' : 'Disliked'} message:`, message.id);
  };

  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
    }
    // console.log('Delete message:', message.id);
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
    // console.log('Share message:', message.id);
  };

  const handleMoreActions = () => {
    // TODO: Implement more actions menu (pin, forward, etc.)
    // console.log('More actions for message:', message.id);
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
          
          {message.isInterrupted && (
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginInlineStart: '8px',
                color: theme.palette.warning.main,
                fontSize: '12px',
                fontStyle: 'italic',
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: theme.palette.warning.main,
                  borderRadius: '1px',
                }}
              />
              <Typography
                component="span"
                variant="caption"
                sx={{
                  color: theme.palette.warning.main,
                  fontSize: '11px',
                  fontStyle: 'italic',
                }}
              >
                {t('message.generationStopped')}
              </Typography>
            </Box>
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
        
        {message.isInterrupted && (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginInlineStart: '8px',
              color: theme.palette.warning.main,
              fontSize: '12px',
              fontStyle: 'italic',
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '2px',
                height: '1em',
                backgroundColor: theme.palette.warning.main,
                borderRadius: '1px',
              }}
            />
            <Typography
              component="span"
              variant="caption"
              sx={{
                color: theme.palette.warning.main,
                fontSize: '11px',
                fontStyle: 'italic',
              }}
            >
              {t('message.generationStopped')}
            </Typography>
          </Box>
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
const WelcomeScreen = ({ isDarkMode, theme, onToggleSidebar, onToggleTheme, useMockMode, onToggleMockMode, onLogout, userEmail }: {
  isDarkMode: boolean;
  theme: any;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      id="iagent-welcome-screen"
      className="iagent-welcome-container"
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
      {/* Welcome Header */}
      <Box
        id="iagent-welcome-header"
        className="iagent-header-section"
      >
        <ChatHeader 
          onToggleSidebar={onToggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          useMockMode={useMockMode}
          onToggleMockMode={onToggleMockMode}
          onLogout={onLogout}
          userEmail={userEmail}
        />
      </Box>

      {/* Welcome Content */}
      <Box
        id="iagent-welcome-content"
        className="iagent-welcome-main"
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
          id="iagent-welcome-title"
          className="iagent-welcome-heading"
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
          id="iagent-welcome-text"
          className="iagent-welcome-description"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <Typography
            id="iagent-welcome-subtitle"
            className="iagent-welcome-subtitle"
            variant="body1"
            sx={{
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}
          >
            {t('chat.welcome.subtitle')}
          </Typography>
          <Typography
            id="iagent-welcome-description"
            className="iagent-welcome-body"
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

export function ChatArea({ messages, isLoading, onToggleSidebar, isDarkMode, onToggleTheme, useMockMode, onToggleMockMode, onRefreshMessage, onEditMessage, onDeleteMessage, onShareMessage, inputAreaHeight = 80, onLogout, userEmail }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Check if we're currently generating text
      const isGenerating = isLoading || messages.some(m => m.isStreaming);
      
      if (isGenerating) {
        // Smoother scrolling during generation with requestAnimationFrame
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      } else {
        // Scroll with same offset as generation to avoid textarea overlap
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      }
    }
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
        onLogout={onLogout}
        userEmail={userEmail}
      />
    );
  }

  return (
    <Box
      id="iagent-chat-area"
      className="iagent-chat-container"
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
      {/* Chat Header */}
      <Box
        id="iagent-chat-header"
        className="iagent-header-section"
      >
        <ChatHeader 
          onToggleSidebar={onToggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          useMockMode={useMockMode}
          onToggleMockMode={onToggleMockMode}
          onLogout={onLogout}
          userEmail={userEmail}
        />
      </Box>

      {/* Messages Container */}
      <Box 
        id="iagent-messages-container"
        className="iagent-messages-scroll-area"
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          scrollBehavior: 'smooth',
          backgroundColor: 'inherit',
          padding: '32px 16px',
          paddingBottom: `${inputAreaHeight + (isLoading || messages.some(m => m.isStreaming) ? 100 : 20)}px`, // Dynamic padding - lighter offset when generating
          '@media (max-width: 600px)': {
            WebkitOverflowScrolling: 'touch',
            padding: '16px 8px',
            paddingBottom: `${inputAreaHeight + (isLoading || messages.some(m => m.isStreaming) ? 80 : 10)}px`, // Dynamic mobile padding - lighter
          }
        }}
      >
        {/* Messages List */}
        <Box
          id="iagent-messages-list"
          className="iagent-messages-content"
        >
          {messages.map((message, index) => (
            <Box
              key={message.id}
              id={`iagent-message-${message.id}`}
              className={`iagent-message-item iagent-message-${message.role}`}
            >
              <MessageBubble
                message={message}
                isDarkMode={isDarkMode}
                theme={theme}
                onRefreshMessage={onRefreshMessage}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onShareMessage={onShareMessage}
              />
            </Box>
          ))}
        </Box>

        {/* Loading Indicator */}
        {isLoading && !messages.some(m => m.isStreaming) && (
          <Box
            id="iagent-typing-indicator"
            className="iagent-loading-state"
          >
            <TypingIndicator isDarkMode={isDarkMode} theme={theme} />
          </Box>
        )}

        {/* Spacer */}
        <Box 
          id="iagent-messages-spacer"
          className="iagent-flex-spacer"
          sx={{ minHeight: '32px', flexGrow: 1 }} 
        />

        {/* Scroll anchor */}
        <div 
          id="iagent-scroll-anchor"
          className="iagent-scroll-target"
          ref={messagesEndRef} 
        />
      </Box>
    </Box>
  );
} 