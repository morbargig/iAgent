import React, { useEffect } from "react";
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
} from "@mui/material";
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
  Info as InfoIcon,
} from "@mui/icons-material";
import { type Conversation } from "@iagent/chat-types";
import { useTranslation } from "../contexts/TranslationContext";
import { useAppLocalStorage } from "../hooks/storage";
import { useResizable } from "../hooks/useResizable";
import { useConversationEditing } from "../hooks/useConversationEditing";
import { useFeatureFlag } from "../hooks/useFeatureFlag";

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
  onWidthChange?: (width: number) => void;
  onOpenAppDetails?: () => void;
}

// iagent-inspired Sidebar - Clean, minimal navigation

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
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
      onWidthChange,
      onOpenAppDetails,
    },
    ref
  ) => {
    const enableDarkMode = useFeatureFlag('enableDarkMode');
    const enableAppDetails = useFeatureFlag('enableAppDetails');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { t, isRTL } = useTranslation();

    const [storedWidth, setStoredWidth] = useAppLocalStorage('sidebar-width');
    const defaultWidth = storedWidth || 250;

    const { width: sidebarWidth, isResizing, handleMouseDown } = useResizable({
      initialWidth: defaultWidth,
      minWidth: 200,
      maxWidth: 400,
      onWidthChange: (newWidth) => {
        setStoredWidth(newWidth);
        onWidthChange?.(newWidth);
      },
      isRTL,
    });

    const {
      editingId,
      editingTitle,
      setEditingTitle,
      startEdit,
      saveEdit,
      cancelEdit,
      handleKeyPress,
    } = useConversationEditing({
      onRename: onRenameConversation,
      getTitle: (conversation) =>
        conversation.titleKey ? t(conversation.titleKey) : conversation.title,
    });

    useEffect(() => {
      if (onWidthChange && open) {
        onWidthChange(sidebarWidth);
      }
    }, [sidebarWidth, onWidthChange, open]);

    // Sidebar Content - Clean, functional design
    const sidebarContent = (
      <Box
        id="iagent-sidebar-content"
        className="iagent-sidebar-container"
        sx={{
          width: sidebarWidth,
          height: "100vh",
          backgroundColor: isDarkMode ? "#0d0d0d" : "#fafafa", // Match page background closely
          display: "flex",
          flexDirection: "column",
          borderInlineEnd: isDarkMode
            ? `1px solid rgba(255, 255, 255, 0.05)`
            : `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Sidebar Header */}
        <Box
          id="iagent-sidebar-header"
          className="iagent-sidebar-header-section"
          sx={{
            padding: "16px",
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
                position: "absolute",
                insetInlineEnd: 8,
                top: 8,
                color: theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
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
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : theme.palette.divider,
              color: theme.palette.text.primary,
              backgroundColor: "transparent",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "none",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.03)",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.15)"
                  : theme.palette.text.secondary,
                boxShadow: "none",
              },
            }}
          >
            <AddIcon sx={{ fontSize: 16, marginInlineEnd: "8px" }} />
            {t("sidebar.newChat")}
          </Button>
        </Box>

        {/* Conversations List */}
        <Box
          id="iagent-conversations-list"
          className="iagent-sidebar-conversations"
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "0 8px",
            // Clean scrollbar
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.divider,
              borderRadius: "2px",
              "&:hover": {
                backgroundColor: theme.palette.text.secondary,
              },
            },
          }}
        >
          {conversations.length === 0 ? (
            // Empty State
            <Box
              sx={{
                padding: "24px 16px",
                textAlign: "center",
                animation: "fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0, transform: "translateY(4px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <ChatIcon
                sx={{
                  fontSize: 24,
                  marginBottom: "8px",
                  color: theme.palette.text.secondary,
                  opacity: 0.6,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "14px",
                  color: theme.palette.text.secondary,
                  opacity: 0.8,
                  lineHeight: 1.4,
                }}
              >
                {t("sidebar.emptyState")}
              </Typography>
            </Box>
          ) : (
            // Conversation List
            <List sx={{ padding: 0 }}>
              {conversations.map((conversation, index) => (
                <ListItem
                  key={conversation.id}
                  disablePadding
                  sx={{
                    marginBottom: "2px",
                    animation:
                      "conversationSlideIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                    animationDelay: `${index * 0.01}s`,
                    "@keyframes conversationSlideIn": {
                      "0%": { opacity: 0, transform: "translateX(-4px)" },
                      "100%": { opacity: 1, transform: "translateX(0)" },
                    },
                  }}
                >
                  {editingId === conversation.id ? (
                    <ClickAwayListener onClickAway={cancelEdit}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                          gap: "8px",
                        }}
                      >
                        <ChatIcon
                          sx={{
                            fontSize: 16,
                            color: theme.palette.text.secondary,
                            flexShrink: 0,
                          }}
                        />
                        <TextField
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleKeyPress}
                          autoFocus
                          variant="standard"
                          size="small"
                          sx={{
                            flex: 1,
                            "& .MuiInput-root": {
                              fontSize: "14px",
                            },
                            "& .MuiInput-input": {
                              padding: "2px 0",
                            },
                          }}
                        />
                        <IconButton
                          onClick={saveEdit}
                          size="small"
                          sx={{
                            width: 24,
                            height: 24,
                            color: theme.palette.success.main,
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          onClick={cancelEdit}
                          size="small"
                          sx={{
                            width: 24,
                            height: 24,
                            color: theme.palette.text.secondary,
                            "&:hover": {
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
                        borderRadius: "8px",
                        padding: "8px 12px",
                        minHeight: "auto",
                        // Active state
                        backgroundColor:
                          currentConversationId === conversation.id
                            ? isDarkMode
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(59, 130, 246, 0.08)"
                            : "transparent",
                        transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          backgroundColor:
                            currentConversationId === conversation.id
                              ? isDarkMode
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(59, 130, 246, 0.1)"
                              : isDarkMode
                                ? "rgba(255, 255, 255, 0.03)"
                                : "rgba(0, 0, 0, 0.02)",
                          "& .action-btns": { opacity: 1 },
                        },
                      }}
                    >
                      {/* Conversation Icon */}
                      {streamingConversationId === conversation.id ? (
                        <GeneratingIcon
                          sx={{
                            fontSize: 16,
                            marginInlineEnd: "12px",
                            color: theme.palette.primary.main,
                            flexShrink: 0,
                            animation: "pulse 1.5s ease-in-out infinite",
                            "@keyframes pulse": {
                              "0%": {
                                opacity: 0.6,
                                transform: "scale(1)",
                              },
                              "50%": {
                                opacity: 1,
                                transform: "scale(1.1)",
                              },
                              "100%": {
                                opacity: 0.6,
                                transform: "scale(1)",
                              },
                            },
                          }}
                        />
                      ) : (
                        <ChatIcon
                          sx={{
                            fontSize: 16,
                            marginInlineEnd: "12px",
                            color:
                              currentConversationId === conversation.id
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                            flexShrink: 0,
                            transition:
                              "color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      )}

                      {/* Conversation Title */}
                      <ListItemText
                        primary={
                          conversation.titleKey
                            ? t(conversation.titleKey)
                            : conversation.title
                        }
                        primaryTypographyProps={{
                          noWrap: true,
                          variant: "body2",
                          fontSize: "14px",
                          fontWeight:
                            currentConversationId === conversation.id
                              ? 500
                              : 400,
                          color:
                            currentConversationId === conversation.id
                              ? theme.palette.text.primary
                              : theme.palette.text.secondary,
                        }}
                        sx={{
                          "& .MuiListItemText-primary": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.4,
                            transition:
                              "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                          },
                        }}
                      />

                      {/* Action Buttons */}
                      <Box
                        className="action-btns"
                        sx={{
                          display: "flex",
                          opacity: 0,
                          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                          marginInlineStart: "8px",
                          gap: "4px",
                        }}
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(conversation);
                          }}
                          size="small"
                          sx={{
                            width: 24,
                            height: 24,
                            color: theme.palette.text.secondary,
                            borderRadius: "4px",
                            "&:hover": {
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
                            borderRadius: "4px",
                            "&:hover": {
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
            padding: "16px",
            borderTop: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          {/* Theme Toggle Button */}
          {enableDarkMode && (
            <Button
              id="iagent-theme-toggle"
              className="iagent-theme-switch-button"
              onClick={onToggleTheme}
              variant="text"
              fullWidth
              sx={{
                justifyContent: "flex-start",
                padding: "8px 12px",
                borderRadius: "8px",
                color: theme.palette.text.secondary,
                fontSize: "14px",
                fontWeight: 400,
                textTransform: "none",
                transition:
                  "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
                mb: 1,
              }}
            >
              {isDarkMode ? (
                <LightModeIcon sx={{ fontSize: 16, marginInlineEnd: "12px" }} />
              ) : (
                <DarkModeIcon sx={{ fontSize: 16, marginInlineEnd: "12px" }} />
              )}
              {isDarkMode ? t("theme.light") : t("theme.dark")}
            </Button>
          )}

          {/* App Details Button */}
          {onOpenAppDetails && enableAppDetails && (
            <Button
              id="iagent-app-details"
              className="iagent-app-details-button"
              onClick={onOpenAppDetails}
              variant="text"
              fullWidth
              sx={{
                justifyContent: "flex-start",
                padding: "8px 12px",
                borderRadius: "8px",
                color: theme.palette.text.secondary,
                fontSize: "14px",
                fontWeight: 400,
                textTransform: "none",
                transition:
                  "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <InfoIcon sx={{ fontSize: 16, marginInlineEnd: "12px" }} />
              {t("appDetails.title")}
            </Button>
          )}
        </Box>

        {!isMobile && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              position: "absolute",
              top: 0,
              insetInlineEnd: 0,
              width: "4px",
              height: "100%",
              cursor: "col-resize",
              backgroundColor: "transparent",
              transition: "background-color 150ms ease",
              zIndex: 10,
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.5,
              },
              "&:active": {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.8,
              },
            }}
          />
        )}
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
            "& .MuiDrawer-paper": {
              backgroundColor: isDarkMode ? "#171717" : "#f9fafb",
              width: "85%",
              maxWidth: "320px",
              height: "100vh",
              zIndex: 1300,
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.5)"
                : "0 8px 32px rgba(0, 0, 0, 0.15)",
              borderInlineEnd: "none",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          {/* Mobile Sidebar Content with fixed header */}
          <Box
            sx={{
              width: "100%",
              height: "100vh",
              backgroundColor: isDarkMode ? "#171717" : "#f9fafb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Mobile Header */}
            <Box
              sx={{
                padding: "16px",
                flexShrink: 0,
                position: "relative",
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {/* Mobile close button - Fixed positioning */}
              <IconButton
                onClick={onToggle}
                sx={{
                  position: "absolute",
                  insetInlineEnd: 12,
                  top: 12,
                  color: theme.palette.text.secondary,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "8px",
                  width: 36,
                  height: 36,
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                    transform: "scale(1.05)",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              {/* New Chat Button */}
              <Button
                onClick={onNewConversation}
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  backgroundColor: "transparent",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textTransform: "none",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "none",
                  marginTop: "8px",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    boxShadow: "none",
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 16, marginInlineEnd: "8px" }} />
                {t("sidebar.newChat")}
              </Button>
            </Box>

            {/* Conversations List */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                padding: "8px",
                "&::-webkit-scrollbar": {
                  width: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: theme.palette.divider,
                  borderRadius: "2px",
                  "&:hover": {
                    backgroundColor: theme.palette.text.secondary,
                  },
                },
              }}
            >
              {conversations.length === 0 ? (
                <Box
                  sx={{
                    padding: "24px 16px",
                    textAlign: "center",
                  }}
                >
                  <ChatIcon
                    sx={{
                      fontSize: 24,
                      marginBottom: "8px",
                      color: theme.palette.text.secondary,
                      opacity: 0.6,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "14px",
                      color: theme.palette.text.secondary,
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}
                  >
                    {t("sidebar.emptyState")}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ padding: 0 }}>
                  {conversations.map((conversation) => (
                    <ListItem
                      key={conversation.id}
                      disablePadding
                      sx={{ marginBottom: "2px" }}
                    >
                      <ListItemButton
                        onClick={() => {
                          onSelectConversation(conversation.id);
                          onToggle(); // Close sidebar on mobile after selection
                        }}
                        sx={{
                          borderRadius: "8px",
                          padding: "12px",
                          minHeight: "auto",
                          backgroundColor:
                            currentConversationId === conversation.id
                              ? theme.palette.action.selected
                              : "transparent",
                          "&:hover": {
                            backgroundColor:
                              currentConversationId === conversation.id
                                ? theme.palette.action.selected
                                : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ChatIcon
                          sx={{
                            fontSize: 16,
                            marginInlineEnd: "12px",
                            color:
                              currentConversationId === conversation.id
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                            flexShrink: 0,
                          }}
                        />

                        <ListItemText
                          primary={
                            conversation.titleKey
                              ? t(conversation.titleKey)
                              : conversation.title
                          }
                          primaryTypographyProps={{
                            noWrap: true,
                            variant: "body2",
                            fontSize: "14px",
                            fontWeight:
                              currentConversationId === conversation.id
                                ? 500
                                : 400,
                            color:
                              currentConversationId === conversation.id
                                ? theme.palette.text.primary
                                : theme.palette.text.secondary,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Mobile Footer */}
            <Box
              sx={{
                padding: "16px",
                borderTop: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
                paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              {enableDarkMode && (
                <Button
                  onClick={onToggleTheme}
                  variant="text"
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px",
                    borderRadius: "8px",
                    color: theme.palette.text.secondary,
                    fontSize: "14px",
                    fontWeight: 400,
                    textTransform: "none",
                    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                    mb: 1,
                  }}
                >
                  {isDarkMode ? (
                    <LightModeIcon
                      sx={{ fontSize: 16, marginInlineEnd: "12px" }}
                    />
                  ) : (
                    <DarkModeIcon
                      sx={{ fontSize: 16, marginInlineEnd: "12px" }}
                    />
                  )}
                  {isDarkMode ? t("theme.light") : t("theme.dark")}
                </Button>
              )}
              {onOpenAppDetails && enableAppDetails && (
                <Button
                  onClick={onOpenAppDetails}
                  variant="text"
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px",
                    borderRadius: "8px",
                    color: theme.palette.text.secondary,
                    fontSize: "14px",
                    fontWeight: 400,
                    textTransform: "none",
                    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <InfoIcon sx={{ fontSize: 16, marginInlineEnd: "12px" }} />
                  {t("appDetails.title")}
                </Button>
              )}
            </Box>
          </Box>
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
          width: open ? sidebarWidth : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: isResizing
            ? "none"
            : "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100vh",
        }}
      >
        {sidebarContent}
      </Box>
    );
  }
);
