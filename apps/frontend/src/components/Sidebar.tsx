import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  useTheme,
  Drawer,
  useMediaQuery,
  TextField,
  ClickAwayListener,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CancelIcon,
  Psychology as GeneratingIcon,
} from '@mui/icons-material';
import { type Conversation } from '@iagent/stream-mocks';
import { useTranslation } from '../contexts/TranslationContext';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  open: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  streamingConversationId?: string | null;
}

// iagent-inspired Sidebar - Clean, minimal navigation

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation, 
  onDeleteConversation,
  onRenameConversation,
  open,
  onToggle,
  isDarkMode,
  onToggleTheme,
  streamingConversationId,
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  
  // State for editing conversation names
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.titleKey ? t(conversation.titleKey) : conversation.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Sidebar Content - Clean, functional design
  const sidebarContent = (
    <Box
      id="iagent-sidebar-content"
      className="iagent-sidebar-container"
      sx={{
        width: 250,
        height: '100vh',
        backgroundColor: isDarkMode ? '#171717' : '#f9fafb', // Clean, muted background
        display: 'flex',
        flexDirection: 'column',
        borderInlineEnd: isDarkMode ? 'none' : `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header */}
      <Box 
        id="iagent-sidebar-header"
        className="iagent-sidebar-header-section"
        sx={{ 
          padding: '16px',
          flexShrink: 0,
        }}
      >
        {/* Mobile close button */}
        {isMobile && (
          <IconButton
            id="iagent-sidebar-close"
            className="iagent-mobile-close-button no-rtl-transform"
            onClick={onToggle}
            sx={{ 
              position: 'absolute', 
              insetInlineEnd: 8, 
              top: 8,
              color: theme.palette.text.secondary,
              borderRadius: '6px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        {/* New Chat Button */}
        <Button
          id="iagent-new-chat-button"
          className="iagent-new-conversation-button"
          onClick={onNewConversation}
          variant="outlined"
          fullWidth
          sx={{ 
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            backgroundColor: 'transparent',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.text.secondary,
              boxShadow: 'none',
            },
          }}
        >
          <AddIcon sx={{ fontSize: 16, marginInlineEnd: '8px' }} />
          {t('sidebar.newChat')}
        </Button>
      </Box>

      {/* Conversations List */}
      <Box 
        id="iagent-conversations-list"
        className="iagent-sidebar-conversations"
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '0 8px',
          // Clean scrollbar
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.divider,
            borderRadius: '2px',
            '&:hover': {
              backgroundColor: theme.palette.text.secondary,
            },
          },
        }}
      >
        {conversations.length === 0 ? (
          // Empty State
          <Box sx={{ 
            padding: '24px 16px', 
            textAlign: 'center',
            animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(4px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}>
            <ChatIcon sx={{ 
              fontSize: 24, 
              marginBottom: '8px',
              color: theme.palette.text.secondary,
              opacity: 0.6,
            }} />
            <Typography variant="body2" sx={{ 
              fontSize: '14px', 
              color: theme.palette.text.secondary,
              opacity: 0.8,
              lineHeight: 1.4,
            }}>
              {t('sidebar.emptyState')}
            </Typography>
          </Box>
        ) : (
          // Conversation List
          <List sx={{ padding: 0 }}>
            {conversations.map((conversation, index) => (
              <ListItem key={conversation.id} disablePadding sx={{ 
                marginBottom: '2px',
                animation: 'conversationSlideIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                animationDelay: `${index * 0.01}s`,
                '@keyframes conversationSlideIn': {
                  '0%': { opacity: 0, transform: 'translateX(-4px)' },
                  '100%': { opacity: 1, transform: 'translateX(0)' },
                },
              }}>
                {editingId === conversation.id ? (
                  // Edit Mode
                  <ClickAwayListener onClickAway={handleCancelEdit}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: theme.palette.action.hover,
                        gap: '8px',
                      }}
                    >
                      <ChatIcon sx={{ 
                        fontSize: 16, 
                        color: theme.palette.text.secondary,
                        flexShrink: 0,
                      }} />
                      
                      <TextField
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        variant="standard"
                        size="small"
                        sx={{
                          flex: 1,
                          '& .MuiInput-root': {
                            fontSize: '14px',
                          },
                          '& .MuiInput-input': {
                            padding: '2px 0',
                          },
                        }}
                      />
                      
                      {/* Save Button */}
                      <IconButton
                        onClick={handleSaveEdit}
                        size="small"
                        sx={{
                          width: 24,
                          height: 24,
                          color: theme.palette.success.main,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      
                      {/* Cancel Button */}
                      <IconButton
                        onClick={handleCancelEdit}
                        size="small"
                        sx={{
                          width: 24,
                          height: 24,
                          color: theme.palette.text.secondary,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            color: theme.palette.error.main,
                          },
                        }}
                      >
                        <CancelIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </ClickAwayListener>
                ) : (
                  // Normal Mode
                  <ListItemButton
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      if (isMobile) onToggle();
                    }}
                    sx={{
                      borderRadius: '8px',
                      padding: '8px 12px',
                      minHeight: 'auto',
                      // Active state
                      backgroundColor: currentConversationId === conversation.id 
                        ? theme.palette.action.selected
                        : 'transparent',
                      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: currentConversationId === conversation.id 
                          ? theme.palette.action.selected
                          : theme.palette.action.hover,
                        '& .action-btns': { opacity: 1 },
                      },
                    }}
                  >
                    {/* Conversation Icon */}
                    {streamingConversationId === conversation.id ? (
                      <GeneratingIcon
                        sx={{
                          fontSize: 16,
                          marginInlineEnd: '12px',
                          color: theme.palette.primary.main,
                          flexShrink: 0,
                          animation: 'pulse 1.5s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%': {
                              opacity: 0.6,
                              transform: 'scale(1)',
                            },
                            '50%': {
                              opacity: 1,
                              transform: 'scale(1.1)',
                            },
                            '100%': {
                              opacity: 0.6,
                              transform: 'scale(1)',
                            },
                          },
                        }}
                      />
                    ) : (
                      <ChatIcon sx={{ 
                        fontSize: 16, 
                        marginInlineEnd: '12px',
                        color: currentConversationId === conversation.id 
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                        flexShrink: 0,
                        transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    )}
                    
                    {/* Conversation Title */}
                    <ListItemText
                      primary={conversation.titleKey ? t(conversation.titleKey) : conversation.title}
                      primaryTypographyProps={{
                        noWrap: true,
                        variant: 'body2',
                        fontSize: '14px',
                        fontWeight: currentConversationId === conversation.id ? 500 : 400,
                        color: currentConversationId === conversation.id 
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                      }}
                      sx={{ 
                        '& .MuiListItemText-primary': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.4,
                          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }
                      }}
                    />
                    
                    {/* Action Buttons */}
                    <Box
                      className="action-btns"
                      sx={{
                        display: 'flex',
                        opacity: 0,
                        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                        marginInlineStart: '8px',
                        gap: '4px',
                      }}
                    >
                      {/* Edit Button */}
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(conversation);
                        }}
                        size="small"
                        sx={{ 
                          width: 24,
                          height: 24,
                          color: theme.palette.text.secondary,
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      
                      {/* Delete Button */}
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        size="small"
                        sx={{ 
                          width: 24,
                          height: 24,
                          color: theme.palette.text.secondary,
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            color: theme.palette.error.main,
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Sidebar Footer */}
      <Box 
        id="iagent-sidebar-footer"
        className="iagent-sidebar-footer-section"
        sx={{ 
          padding: '16px',
          borderTop: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
        }}
      >
        {/* Theme Toggle Button */}
        <Button
          id="iagent-theme-toggle"
          className="iagent-theme-switch-button"
          onClick={onToggleTheme}
          variant="text"
          fullWidth
          sx={{ 
            justifyContent: 'flex-start',
            padding: '8px 12px',
            borderRadius: '8px',
            color: theme.palette.text.secondary,
            fontSize: '14px',
            fontWeight: 400,
            textTransform: 'none',
            transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
            },
          }}
        >
          {isDarkMode ? (
                          <LightModeIcon sx={{ fontSize: 16, marginInlineEnd: '12px' }} />
          ) : (
                          <DarkModeIcon sx={{ fontSize: 16, marginInlineEnd: '12px' }} />
          )}
          {isDarkMode ? t('theme.light') : t('theme.dark')}
        </Button>
      </Box>
    </Box>
  );

  // Mobile Implementation
  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onToggle}
        variant="temporary"
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: theme.palette.background.default,
            width: '85%',
            maxWidth: '300px',
            height: '100%',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '@media (max-width: 600px)': {
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }
          },

        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // Desktop Implementation
  return (
    <Box
      id="iagent-sidebar"
      className="iagent-sidebar-wrapper"
      ref={ref}
      sx={{
        width: open ? 250 : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100vh',
      }}
    >
      {sidebarContent}
    </Box>
  );
});