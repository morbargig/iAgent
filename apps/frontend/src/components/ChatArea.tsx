import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
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
} from '@mui/icons-material';
import { Message } from '../app/app';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onRefreshMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string, content: string) => void;
}

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
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const [liked, setLiked] = React.useState<boolean | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chat Message',
          text: message.content,
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
      onShareMessage(message.id, message.content);
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
          maxWidth: '42rem', // Match iagent thread max-width
          py: 2,
          animation: 'messageSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes messageSlideIn': {
            '0%': { opacity: 0, transform: 'translateY(4px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          // Show action buttons when hovering over the entire message container
          '&:hover .user-action-bar': {
            opacity: 1,
          },
        }}
      >
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
            // Keep buttons visible when hovering over the action area itself
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          <Tooltip title={copied ? "Copied!" : "Copy"}>
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

          <Tooltip title="Edit message">
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

          <Tooltip title="Refresh query">
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

        {/* User message bubble */}
        <Box
          className="message-container"
          sx={{
            gridColumn: '2',
            gridRow: '1',
            backgroundColor: isDarkMode ? '#404040' : '#f3f4f6', // Muted background
            color: theme.palette.text.primary,
            maxWidth: 'calc(42rem * 0.8)', // 80% of container width
            borderRadius: '24px', // rounded-3xl like iagent
            padding: '10px 20px',
            wordBreak: 'break-word',
            fontSize: '16px',
            lineHeight: 1.7,
          }}
        >
          {message.content}
          
          {/* Typing indicator for streaming user messages */}
          {message.isStreaming && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                backgroundColor: theme.palette.primary.main,
                marginLeft: '4px',
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
      </Box>
    );
  }

  // Assistant Message - Left-aligned, clean layout
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        gridTemplateRows: 'auto 1fr auto',
        position: 'relative',
        width: '100%',
        maxWidth: '42rem',
        py: 2,
        animation: 'messageSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes messageSlideIn': {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        // Show action buttons when hovering over the entire message container
        '&:hover .assistant-action-bar': {
          opacity: 1,
        },
      }}
    >
      {/* Assistant message content */}
      <Box
        className="message-container"
        sx={{
          gridColumn: '2 / 4',
          gridRow: '1',
          color: theme.palette.text.primary,
          maxWidth: 'calc(42rem * 0.8)',
          wordBreak: 'break-word',
          lineHeight: 1.7,
          fontSize: '16px',
          margin: '6px 0',
        }}
      >
        {message.content}
        
        {/* Typing indicator */}
        {message.isStreaming && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              backgroundColor: theme.palette.primary.main,
              marginLeft: '4px',
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
          gridColumn: '2 / 4',
          gridRow: '2',
          display: 'flex',
          gap: '4px',
          marginTop: '8px',
          opacity: 0,
          transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          // Keep buttons visible when hovering over the action area itself
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        {/* Copy Button */}
        <Tooltip title={copied ? "Copied!" : "Copy"}>
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
        <Tooltip title={liked === true ? "Remove like" : "Good response"}>
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
        <Tooltip title={liked === false ? "Remove dislike" : "Bad response"}>
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
        
        {/* Refresh Button */}
        {!message.isStreaming && (
          <Tooltip title="Regenerate response">
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
const TypingIndicator = ({ isDarkMode, theme }: { isDarkMode: boolean; theme: any }) => (
  <MessageBubble 
    message={{
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }} 
    isDarkMode={isDarkMode} 
    theme={theme}
  />
);

// Welcome Screen - Clean, centered
const WelcomeScreen = ({ isDarkMode, theme, onToggleSidebar, onToggleTheme }: {
  isDarkMode: boolean;
  theme: any;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
}) => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.default,
      height: '100%',
      overflow: 'hidden',
    }}
  >
    {/* Header */}
    <Box sx={{ 
      display: 'flex', 
      height: '64px', // h-16
      alignItems: 'center',
      gap: '8px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: '0 16px',
      flexShrink: 0,
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
      
      <Box sx={{ width: '1px', height: '16px', backgroundColor: theme.palette.divider, marginRight: '8px' }} />
      
      <Typography variant="h6" sx={{ 
        color: theme.palette.text.primary,
        fontWeight: 600,
        fontSize: '16px',
      }}>
        Assistant
      </Typography>

      <Box sx={{ flex: 1 }} />

      <IconButton 
        onClick={onToggleTheme}
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
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Box>

    {/* Welcome Content */}
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'auto',
        padding: '32px 16px',
      }}
    >
      <Box sx={{ 
        display: 'flex',
        width: '100%',
        maxWidth: '42rem',
        flexGrow: 1,
        flexDirection: 'column',
      }}>
        <Box sx={{
          display: 'flex',
          width: '100%',
          flexGrow: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="h4" sx={{ 
            marginTop: '16px',
            fontWeight: 500,
            color: theme.palette.text.primary,
            fontSize: '18px',
            textAlign: 'center',
          }}>
            How can I help you today?
          </Typography>
        </Box>
        
        {/* Welcome suggestions */}
        <Box sx={{
          marginTop: '12px',
          display: 'flex',
          width: '100%',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <Box
            sx={{
              display: 'flex',
              maxWidth: '384px', // max-w-sm
              flexGrow: 1,
              flexBasis: 0,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              padding: '12px',
              transition: 'colors 150ms ease-in',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Typography sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}>
              What can you help me with?
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              maxWidth: '384px',
              flexGrow: 1,
              flexBasis: 0,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              padding: '12px',
              transition: 'colors 150ms ease-in',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Typography sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}>
              Tell me about yourself
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

export function ChatArea({ messages, isLoading, onToggleSidebar, isDarkMode, onToggleTheme, onRefreshMessage, onEditMessage, onDeleteMessage, onShareMessage }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

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
      }}
    >
      {/* Header */}
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
        zIndex: 10,
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
        
        <Box sx={{ width: '1px', height: '16px', backgroundColor: theme.palette.divider, marginRight: '8px' }} />
        
        <Typography variant="h6" sx={{ 
          color: theme.palette.text.primary,
          fontWeight: 600,
          fontSize: '16px',
        }}>
          Assistant
        </Typography>

        <Box sx={{ flex: 1 }} />

        <IconButton 
          onClick={onToggleTheme}
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
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      {/* Messages Container */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          scrollBehavior: 'smooth',
          backgroundColor: 'inherit',
          padding: '32px 16px',
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