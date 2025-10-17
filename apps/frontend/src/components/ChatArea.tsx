import { useEffect, useRef, useState, MouseEvent } from "react";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import {
  SmartToy as BotIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Api as ApiIcon,
  Psychology as MockIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  PlayArrow as ApplyIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { type Message } from "@iagent/stream-mocks";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { FileAttachmentCard } from "./FileAttachmentCard";
import {
  extractPlainTextFromMarkdown,
  copyToClipboard,
} from "../utils/textUtils";
import { useTranslation } from "../contexts/TranslationContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FilterDetailsDialog } from "./FilterDetailsDialog";

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
  currentChatId?: string; // Current chat ID for filter management
  authToken?: string; // Auth token for API calls
  onOpenReport?: (url: string) => void; // Handler for opening report links
}

// Shared Header Component
const ChatHeader = ({
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  useMockMode,
  onToggleMockMode,
  onLogout,
  userEmail,
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
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(
    null
  );

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
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
    <Box
      sx={{
        display: "flex",
        height: "64px",
        alignItems: "center",
        gap: "8px",
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: "0 16px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <IconButton
        onClick={onToggleSidebar}
        aria-label={t("sidebar.toggle")}
        sx={{
          color: theme.palette.text.secondary,
          borderRadius: "6px",
          minWidth: "44px",
          minHeight: "44px",
          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
          },
        }}
      >
        <MenuIcon />
      </IconButton>

      <Box
        sx={{
          width: "1px",
          height: "16px",
          backgroundColor: theme.palette.divider,
          marginInlineEnd: "8px",
        }}
      />

      <Typography
        variant="h6"
        sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
          fontSize: "16px",
        }}
      >
        {t("message.assistant")}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* Language Switcher */}
      <Box sx={{ marginInlineEnd: "8px" }}>
        <LanguageSwitcher isDarkMode={isDarkMode} />
      </Box>

      {/* Mock Mode Toggle - ChatGPT Style */}
      <Tooltip
        title={
          useMockMode ? t("common.disableMockApi") : t("common.enableMockApi")
        }
      >
        <IconButton
          onClick={onToggleMockMode}
          className="no-rtl-transform"
          aria-label={
            useMockMode ? t("common.disableMockApi") : t("common.enableMockApi")
          }
          sx={{
            marginInlineEnd: "8px",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: useMockMode
              ? isDarkMode
                ? "rgba(52, 53, 65, 1)"
                : "rgba(0, 0, 0, 0.05)"
              : "transparent",
            color: useMockMode
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: useMockMode
                ? isDarkMode
                  ? "rgba(52, 53, 65, 0.8)"
                  : "rgba(0, 0, 0, 0.08)"
                : theme.palette.action.hover,
              borderColor: useMockMode
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          {useMockMode ? (
            <MockIcon sx={{ fontSize: "18px" }} />
          ) : (
            <ApiIcon sx={{ fontSize: "18px" }} />
          )}
        </IconButton>
      </Tooltip>

      <IconButton
        onClick={onToggleTheme}
        className="no-rtl-transform"
        aria-label={isDarkMode ? t("theme.light") : t("theme.dark")}
        sx={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: "transparent",
          color: theme.palette.text.secondary,
          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.text.secondary,
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        }}
      >
        {isDarkMode ? (
          <LightModeIcon sx={{ fontSize: "18px" }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: "18px" }} />
        )}
      </IconButton>

      {/* User Menu */}
      {userEmail && (
        <>
          <Box
            sx={{
              width: "1px",
              height: "16px",
              backgroundColor: theme.palette.divider,
              marginInline: "8px",
            }}
          />
          <Tooltip title={t("user.menu")}>
            <IconButton
              onClick={handleUserMenuOpen}
              className="no-rtl-transform"
              aria-label="User menu"
              sx={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: userMenuAnchor
                  ? theme.palette.action.selected
                  : "transparent",
                color: theme.palette.text.secondary,
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.text.secondary,
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              <PersonIcon sx={{ fontSize: "18px" }} />
            </IconButton>
          </Tooltip>

          {/* User Menu Popover */}
          <Popover
            open={Boolean(userMenuAnchor)}
            anchorEl={userMenuAnchor}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            sx={{
              "& .MuiPaper-root": {
                mt: 1,
                minWidth: 200,
                borderRadius: "12px",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isDarkMode
                  ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                  : "0 8px 32px rgba(0, 0, 0, 0.12)",
                backgroundColor: theme.palette.background.paper,
              },
            }}
          >
            <List sx={{ padding: "8px" }}>
              {/* User Info Section */}
              <ListItem sx={{ padding: "12px 16px" }}>
                <ListItemIcon sx={{ minWidth: "40px" }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: theme.palette.primary.main,
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {userEmail.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={userEmail}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    noWrap: true,
                  }}
                  secondary="Signed in"
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: theme.palette.text.secondary,
                  }}
                />
              </ListItem>

              <Divider sx={{ margin: "4px 8px" }} />

              {/* Logout Option */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    borderRadius: "8px",
                    margin: "0 4px",
                    padding: "8px 12px",
                    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "36px" }}>
                    <LogoutIcon
                      sx={{
                        fontSize: "18px",
                        color: theme.palette.error.main,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("auth.logout")}
                    primaryTypographyProps={{
                      variant: "body2",
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
const MessageBubble = ({
  message,
  isDarkMode,
  theme,
  onRefreshMessage,
  onEditMessage,
  onDeleteMessage,
  onShareMessage,
  currentChatId,
  authToken,
  onFilterInfo,
  onOpenReport,
}: {
  message: Message;
  isDarkMode: boolean;
  theme: any;
  onRefreshMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string, content: string) => void;
  currentChatId?: string;
  authToken?: string;
  onFilterInfo?: (event: React.MouseEvent<HTMLElement>, message: any) => void;
  onOpenReport?: (url: string) => void;
}) => {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

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
      console.error("Failed to copy text:", error);
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

  if (isUser) {
    // User Message - Right-aligned with muted background
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(72px, 1fr) auto",
          gridTemplateRows: "auto auto",
          gap: "8px",
          width: "100%",
          py: 2,
          animation: "messageSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes messageSlideIn": {
            "0%": { opacity: 0, transform: "translateY(4px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          "&:hover .user-action-bar": {
            opacity: 1,
          },
        }}
      >
        {/* User message bubble */}
        <Box
          className="message-container"
          sx={{
            gridColumn: "2",
            gridRow: "1",
            backgroundColor: isDarkMode ? "#404040" : "#f3f4f6",
            color: theme.palette.text.primary,
            borderRadius: "24px",
            padding: "10px 20px",
            wordBreak: "break-word",
            fontSize: "16px",
            lineHeight: 1.7,
          }}
        >
          {/* File Attachments - Rich preview cards with download/preview buttons */}
          {message.attachments && message.attachments.length > 0 && (
            <FileAttachmentCard
              files={message.attachments.map((f: any) => ({
                id: f.id,
                name: f.filename || f.name,
                originalName: f.filename || f.name,
                size: f.size,
                type: f.mimetype || f.mimeType || "application/octet-stream",
                mimeType:
                  f.mimetype || f.mimeType || "application/octet-stream",
                uploadedAt: new Date(
                  f.uploadDate || f.uploadedAt || Date.now()
                ),
                userId: "user",
                status: "ready" as const,
                url: `http://localhost:3030/api/files/${f.id}`,
                metadata: {},
              }))}
              isDarkMode={isDarkMode}
            />
          )}

          <MarkdownRenderer
            content={message.content}
            isDarkMode={isDarkMode}
            onOpenReport={onOpenReport}
          />

          {message.isStreaming && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "2px",
                height: "1.2em",
                backgroundColor: theme.palette.primary.main,
                marginInlineStart: "4px",
                borderRadius: "1px",
                animation: "typingBlink 1s infinite",
                "@keyframes typingBlink": {
                  "0%, 50%": { opacity: 1 },
                  "51%, 100%": { opacity: 0.3 },
                },
              }}
            />
          )}

          {message.isInterrupted && (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginInlineStart: "8px",
                color: theme.palette.warning.main,
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: "2px",
                  height: "1em",
                  backgroundColor: theme.palette.warning.main,
                  borderRadius: "1px",
                }}
              />
              <Typography
                component="span"
                variant="caption"
                sx={{
                  color: theme.palette.warning.main,
                  fontSize: "11px",
                  fontStyle: "italic",
                }}
              >
                {t("message.generationStopped")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* User action bar */}
        <Box
          className="user-action-bar"
          sx={{
            gridColumn: "2",
            gridRow: "2",
            display: "flex",
            gap: "4px",
            marginTop: "8px",
            opacity: 0,
            transition: "opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              opacity: 1,
            },
          }}
        >
          {/* Filter Info Icon */}
          {message.filterSnapshot && (
            <Tooltip title={t("message.filterInfo")}>
              <IconButton
                onClick={(e) => onFilterInfo?.(e, message)}
                size="small"
                sx={{
                  width: 28,
                  height: 28,
                  color: theme.palette.text.secondary,
                  borderRadius: "6px",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <InfoIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={copied ? t("message.copied") : t("message.copy")}>
            <IconButton
              onClick={handleCopy}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: copied
                  ? theme.palette.success.main
                  : theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: copied
                    ? theme.palette.success.main
                    : theme.palette.text.primary,
                },
              }}
            >
              {copied ? (
                <CheckIcon sx={{ fontSize: 14 }} />
              ) : (
                <CopyIcon sx={{ fontSize: 14 }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title={t("message.edit")}>
            <IconButton
              onClick={handleEdit}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t("message.refresh")}>
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
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
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "auto auto",
        position: "relative",
        width: "100%",
        py: 2,
        animation: "messageSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "@keyframes messageSlideIn": {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "&:hover .assistant-action-bar": {
          opacity: 1,
        },
        "@media (hover: none)": {
          "& .assistant-action-bar": {
            opacity: 1,
          },
        },
      }}
    >
      {/* Assistant message content */}
      <Box
        className="message-container"
        sx={{
          gridColumn: "1 / -1",
          gridRow: "1",
          color: theme.palette.text.primary,
          wordBreak: "break-word",
          lineHeight: 1.7,
          fontSize: "16px",
          margin: "6px 0",
          padding: "10px 20px",
          borderRadius: "24px",
        }}
      >
        <MarkdownRenderer
          content={message.content}
          isDarkMode={isDarkMode}
          onOpenReport={onOpenReport}
        />

        {message.isStreaming && (
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: "2px",
              height: "1.2em",
              backgroundColor: theme.palette.primary.main,
              marginInlineStart: "4px",
              borderRadius: "1px",
              animation: "typingBlink 1s infinite",
              "@keyframes typingBlink": {
                "0%, 50%": { opacity: 1 },
                "51%, 100%": { opacity: 0.3 },
              },
            }}
          />
        )}

        {message.isInterrupted && (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginInlineStart: "8px",
              color: theme.palette.warning.main,
              fontSize: "12px",
              fontStyle: "italic",
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "2px",
                height: "1em",
                backgroundColor: theme.palette.warning.main,
                borderRadius: "1px",
              }}
            />
            <Typography
              component="span"
              variant="caption"
              sx={{
                color: theme.palette.warning.main,
                fontSize: "11px",
                fontStyle: "italic",
              }}
            >
              {t("message.generationStopped")}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Assistant action bar */}
      <Box
        className="assistant-action-bar"
        sx={{
          gridColumn: "1 / -1",
          gridRow: "2",
          display: "flex",
          gap: "4px",
          marginTop: "8px",
          marginBottom: "8px",
          opacity: 0,
          position: "relative",
          zIndex: 10,
          transition: "opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            opacity: 1,
          },
        }}
      >
        {/* Filter Info Icon */}
        {message.filterSnapshot && (
          <Tooltip title={t("message.filterInfo")}>
            <IconButton
              onClick={(e) => onFilterInfo?.(e, message)}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <InfoIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Copy Button */}
        <Tooltip title={copied ? t("message.copied") : t("message.copy")}>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: copied
                ? theme.palette.success.main
                : theme.palette.text.secondary,
              borderRadius: "6px",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: copied
                  ? theme.palette.success.main
                  : theme.palette.text.primary,
              },
            }}
          >
            {copied ? (
              <CheckIcon sx={{ fontSize: 14 }} />
            ) : (
              <CopyIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Like Button */}
        <Tooltip
          title={
            liked === true ? t("message.removeLike") : t("message.goodResponse")
          }
        >
          <IconButton
            onClick={handleLike}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color:
                liked === true
                  ? theme.palette.success.main
                  : theme.palette.text.secondary,
              borderRadius: "6px",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color:
                  liked === true
                    ? theme.palette.success.main
                    : theme.palette.text.primary,
              },
            }}
          >
            <ThumbUpIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>

        {/* Dislike Button */}
        <Tooltip
          title={
            liked === false
              ? t("message.removeDislike")
              : t("message.badResponse")
          }
        >
          <IconButton
            onClick={handleDislike}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color:
                liked === false
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
              borderRadius: "6px",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color:
                  liked === false
                    ? theme.palette.error.main
                    : theme.palette.text.primary,
              },
            }}
          >
            <ThumbDownIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>

        {/* Regenerate Response Button */}
        {!message.isStreaming && (
          <Tooltip title={t("message.regenerateResponse")}>
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
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
            gridColumn: "2 / 4",
            gridRow: "3",
            color: theme.palette.text.secondary,
            fontSize: "12px",
            marginTop: "4px",
            opacity: 0.7,
          }}
        >
          {message.metadata.timestamp &&
            new Date(message.metadata.timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  );
};

// Shared Filter Components (used by both user and assistant messages)
const FilterInfoPopover = ({
  message,
  showFilterInfo,
  filterInfoAnchor,
  handleFilterInfoClose,
  formatFilterConfig,
  handleViewFilterDetails,
  handleApplyFilterFromMessage,
  handleRenameFilter,
  isDarkMode,
  theme,
  t,
}: any) => (
  <Popover
    open={showFilterInfo}
    anchorEl={filterInfoAnchor}
    onClose={handleFilterInfoClose}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "left",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "left",
    }}
    sx={{
      "& .MuiPopover-paper": {
        backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
        border: `1px solid ${isDarkMode ? "#444444" : "#e0e0e0"}`,
        borderRadius: "12px",
        maxWidth: "320px",
        padding: "16px",
        boxShadow: isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.4)"
          : "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
    }}
  >
    {message?.filterSnapshot && (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FilterIcon sx={{ fontSize: 16 }} />
          {message.filterSnapshot.name || "Filter Settings"}
        </Typography>

        {message.filterSnapshot.config && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {formatFilterConfig(message.filterSnapshot.config).map(
              (entry: any, index: number) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "13px",
                    lineHeight: 1.4,
                    padding: "6px 12px",
                    backgroundColor: isDarkMode ? "#1e1e1e" : "#f8f9fa",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                  }}
                >
                  {entry}
                </Typography>
              )
            )}

            {formatFilterConfig(message.filterSnapshot.config).length === 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "13px",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                {t("filter.noFilterConfigurationAvailable")}
              </Typography>
            )}
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "11px",
            marginTop: "12px",
            display: "block",
            opacity: 0.7,
          }}
        >
          {t("filter.filterId")}:{" "}
          {message?.filterSnapshot?.filterId ||
            message?.filterId ||
            t("common.unknown")}
        </Typography>

        {/* Filter Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            size="medium"
            onClick={handleViewFilterDetails}
            sx={{
              borderColor: isDarkMode ? "#525252" : "#d1d5db",
              color: isDarkMode ? "#e5e7eb" : "#374151",
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "none",
              minWidth: "90px",
              height: "36px",
              borderRadius: "8px",
              px: 2,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease-in-out",
              boxShadow: isDarkMode
                ? "0 1px 3px rgba(0, 0, 0, 0.3)"
                : "0 1px 3px rgba(0, 0, 0, 0.1)",
              "& .button-icon": {
                order: -1, // Icon first in LTR
                fontSize: "16px",
              },
              'html[dir="rtl"] &': {
                "& .button-icon": {
                  order: 1, // Icon last in RTL
                },
              },
              "&:hover": {
                backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
                color: isDarkMode ? "#f3f4f6" : "#111827",
                transform: "translateY(-1px)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.4)"
                  : "0 4px 12px rgba(0, 0, 0, 0.15)",
              },
            }}
          >
            <ViewIcon className="button-icon" />
            {t("filter.view")}
          </Button>

          <Button
            variant="contained"
            size="medium"
            onClick={handleApplyFilterFromMessage}
            sx={{
              backgroundColor: "#10b981",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "none",
              minWidth: "90px",
              height: "36px",
              borderRadius: "8px",
              px: 2,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease-in-out",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
              "& .button-icon": {
                order: -1, // Icon first in LTR
                fontSize: "16px",
              },
              'html[dir="rtl"] &': {
                "& .button-icon": {
                  order: 1, // Icon last in RTL
                },
              },
              "&:hover": {
                backgroundColor: "#059669",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            <ApplyIcon className="button-icon" />
            {t("filter.apply")}
          </Button>

          <Button
            variant="outlined"
            size="medium"
            onClick={handleRenameFilter}
            sx={{
              borderColor: "#3b82f6",
              color: "#3b82f6",
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "none",
              minWidth: "90px",
              height: "36px",
              borderRadius: "8px",
              px: 2,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease-in-out",
              boxShadow: isDarkMode
                ? "0 1px 3px rgba(59, 130, 246, 0.3)"
                : "0 1px 3px rgba(59, 130, 246, 0.2)",
              "& .button-icon": {
                order: -1, // Icon first in LTR
                fontSize: "16px",
              },
              'html[dir="rtl"] &': {
                "& .button-icon": {
                  order: 1, // Icon last in RTL
                },
              },
              "&:hover": {
                backgroundColor: "#3b82f6",
                borderColor: "#3b82f6",
                color: "#ffffff",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            <EditIcon className="button-icon" />
            {t("filter.rename")}
          </Button>
        </Box>
      </Box>
    )}
  </Popover>
);

const RenameFilterDialog = ({
  renameDialogOpen,
  setRenameDialogOpen,
  newFilterName,
  setNewFilterName,
  saveFilterName,
  isDarkMode,
  t,
}: any) => (
  <Dialog
    open={renameDialogOpen}
    onClose={() => setRenameDialogOpen(false)}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
        borderRadius: "12px",
      },
    }}
  >
    <DialogTitle sx={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
      {t("filter.renameFilter")}
    </DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label={t("filter.filterName")}
        fullWidth
        variant="outlined"
        value={newFilterName}
        onChange={(e) => setNewFilterName(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            color: isDarkMode ? "#ffffff" : "#000000",
            "& fieldset": {
              borderColor: isDarkMode ? "#666666" : "#cccccc",
            },
            "&:hover fieldset": {
              borderColor: isDarkMode ? "#888888" : "#999999",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2196f3",
            },
          },
          "& .MuiInputLabel-root": {
            color: isDarkMode ? "#cccccc" : "#666666",
            "&.Mui-focused": {
              color: "#2196f3",
            },
          },
        }}
      />
    </DialogContent>
    <DialogActions>
      <Button
        onClick={() => setRenameDialogOpen(false)}
        sx={{ color: isDarkMode ? "#cccccc" : "#666666" }}
      >
        {t("common.cancel")}
      </Button>
      <Button
        onClick={saveFilterName}
        variant="contained"
        disabled={!newFilterName.trim()}
        sx={{
          backgroundColor: "#2196f3",
          "&:hover": {
            backgroundColor: "#1976d2",
          },
        }}
      >
        {t("common.save")}
      </Button>
    </DialogActions>
  </Dialog>
);

// Loading Indicator - Clean, minimal
const TypingIndicator = ({
  isDarkMode,
  theme,
}: {
  isDarkMode: boolean;
  theme: any;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: theme.palette.text.secondary,
        py: 2,
      }}
    >
      <BotIcon sx={{ fontSize: 20 }} />
      <Typography variant="body2">{t("chat.thinking")}</Typography>
    </Box>
  );
};

// Welcome Screen - Clean, centered
const WelcomeScreen = ({
  isDarkMode,
  theme,
  onToggleSidebar,
  onToggleTheme,
  useMockMode,
  onToggleMockMode,
  onLogout,
  userEmail,
}: {
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
        boxSizing: "border-box",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Welcome Header */}
      <Box id="iagent-welcome-header" className="iagent-header-section">
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: "24px",
          p: 4,
        }}
      >
        <Typography
          id="iagent-welcome-title"
          className="iagent-welcome-heading"
          variant="h4"
          sx={{
            fontWeight: 600,
            textAlign: "center",
            color: theme.palette.text.primary,
          }}
        >
          {t("chat.welcome.title")}
        </Typography>
        <Box
          id="iagent-welcome-text"
          className="iagent-welcome-description"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <Typography
            id="iagent-welcome-subtitle"
            className="iagent-welcome-subtitle"
            variant="body1"
            sx={{
              textAlign: "center",
              color: theme.palette.text.primary,
            }}
          >
            {t("chat.welcome.subtitle")}
          </Typography>
          <Typography
            id="iagent-welcome-description"
            className="iagent-welcome-body"
            variant="body1"
            sx={{
              textAlign: "center",
              color: theme.palette.text.primary,
            }}
          >
            {t("chat.welcome.description")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export function ChatArea({
  messages,
  isLoading,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  useMockMode,
  onToggleMockMode,
  onRefreshMessage,
  onEditMessage,
  onDeleteMessage,
  onShareMessage,
  inputAreaHeight = 80,
  onLogout,
  userEmail,
  currentChatId,
  authToken,
  onOpenReport,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  // Shared filter state for all messages
  const [filterInfoAnchor, setFilterInfoAnchor] = useState<HTMLElement | null>(
    null
  );
  const [activeMessage, setActiveMessage] = useState<any>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [filterDetailsDialogOpen, setFilterDetailsDialogOpen] = useState(false);
  const showFilterInfo = Boolean(filterInfoAnchor);

  // Shared filter handlers
  const handleFilterInfo = (
    event: React.MouseEvent<HTMLElement>,
    message: any
  ) => {
    setFilterInfoAnchor(event.currentTarget);
    setActiveMessage(message);
  };

  const handleFilterInfoClose = () => {
    setFilterInfoAnchor(null);
    setActiveMessage(null);
  };

  const formatFilterConfig = (config: Record<string, any>) => {
    const entries = [];

    if (config.dateFilter) {
      if (
        config.dateFilter.type === "custom" &&
        config.dateFilter.customRange
      ) {
        entries.push(
          `📅 ${config.dateFilter.customRange.amount} ${config.dateFilter.customRange.type} ago`
        );
      } else if (
        config.dateFilter.type === "picker" &&
        config.dateFilter.dateRange
      ) {
        entries.push(
          `📅 ${new Date(config.dateFilter.dateRange.start).toLocaleDateString()} - ${new Date(config.dateFilter.dateRange.end).toLocaleDateString()}`
        );
      }
    }

    if (config.selectedCountries && config.selectedCountries.length > 0) {
      entries.push(`🌍 Countries: ${config.selectedCountries.join(", ")}`);
    }

    if (config.enabledTools && config.enabledTools.length > 0) {
      entries.push(`🔧 Tools: ${config.enabledTools.join(", ")}`);
    }

    if (config.filterText) {
      entries.push(`📝 Filter: "${config.filterText}"`);
    }

    if (config.selectedMode) {
      entries.push(`⚙️ Mode: ${config.selectedMode}`);
    }

    if (config.excludeAmi !== undefined) {
      entries.push(`🚫 Exclude AMI: ${config.excludeAmi ? "Yes" : "No"}`);
    }

    if (config.includeAmi !== undefined) {
      entries.push(`✅ Include AMI: ${config.includeAmi ? "Yes" : "No"}`);
    }

    return entries;
  };

  const handleViewFilterDetails = () => {
    if (activeMessage?.filterSnapshot) {
      setFilterDetailsDialogOpen(true);
      setFilterInfoAnchor(null);
    }
  };

  const handleApplyFilterFromMessage = () => {
    if (activeMessage?.filterSnapshot && currentChatId) {
      console.log(
        "Applying filter from message:",
        activeMessage.filterSnapshot.name
      );

      const event = new CustomEvent("applyFilterFromMessage", {
        detail: {
          filter: activeMessage.filterSnapshot,
          chatId: currentChatId,
        },
      });
      window.dispatchEvent(event);

      setFilterInfoAnchor(null);
    }
  };

  const handleRenameFilter = () => {
    if (activeMessage?.filterSnapshot?.name) {
      setNewFilterName(activeMessage.filterSnapshot.name);
      setRenameDialogOpen(true);
    }
    setFilterInfoAnchor(null);
  };

  const saveFilterName = async () => {
    if (!activeMessage?.filterSnapshot?.filterId || !newFilterName.trim())
      return;

    try {
      const response = await fetch(
        `/api/chats/filters/${activeMessage.filterSnapshot.filterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ name: newFilterName.trim() }),
        }
      );

      if (response.ok) {
        console.log(t("filter.renameSuccess"));
      } else {
        console.error(t("filter.renameFailed"));
      }
    } catch (error) {
      console.error("Failed to rename filter:", error);
    }

    setRenameDialogOpen(false);
    setNewFilterName("");
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Check if we're currently generating text
      const isGenerating = isLoading || messages.some((m) => m.isStreaming);

      if (isGenerating) {
        // Smoother scrolling during generation with requestAnimationFrame
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        });
      } else {
        // Scroll with same offset as generation to avoid textarea overlap
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
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
        boxSizing: "border-box",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Chat Header */}
      <Box id="iagent-chat-header" className="iagent-header-section">
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
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          scrollBehavior: "smooth",
          backgroundColor: "inherit",
          padding: "32px 16px",
          paddingBottom: `${inputAreaHeight + (isLoading || messages.some((m) => m.isStreaming) ? 100 : 20)}px`, // Dynamic padding - lighter offset when generating
          "@media (max-width: 600px)": {
            WebkitOverflowScrolling: "touch",
            padding: "16px 8px",
            paddingBottom: `${inputAreaHeight + (isLoading || messages.some((m) => m.isStreaming) ? 80 : 10)}px`, // Dynamic mobile padding - lighter
          },
        }}
      >
        {/* Messages List */}
        <Box id="iagent-messages-list" className="iagent-messages-content">
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
                currentChatId={currentChatId}
                authToken={authToken}
                onFilterInfo={handleFilterInfo}
                onOpenReport={onOpenReport}
              />
            </Box>
          ))}
        </Box>

        {/* Loading Indicator */}
        {isLoading && !messages.some((m) => m.isStreaming) && (
          <Box id="iagent-typing-indicator" className="iagent-loading-state">
            <TypingIndicator isDarkMode={isDarkMode} theme={theme} />
          </Box>
        )}

        {/* Spacer */}
        <Box
          id="iagent-messages-spacer"
          className="iagent-flex-spacer"
          sx={{ minHeight: "32px", flexGrow: 1 }}
        />

        {/* Scroll anchor */}
        <div
          id="iagent-scroll-anchor"
          className="iagent-scroll-target"
          ref={messagesEndRef}
        />
      </Box>

      {/* Shared Filter Components */}
      <FilterInfoPopover
        message={activeMessage}
        showFilterInfo={showFilterInfo}
        filterInfoAnchor={filterInfoAnchor}
        handleFilterInfoClose={handleFilterInfoClose}
        formatFilterConfig={formatFilterConfig}
        handleViewFilterDetails={handleViewFilterDetails}
        handleApplyFilterFromMessage={handleApplyFilterFromMessage}
        handleRenameFilter={handleRenameFilter}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      <RenameFilterDialog
        renameDialogOpen={renameDialogOpen}
        setRenameDialogOpen={setRenameDialogOpen}
        newFilterName={newFilterName}
        setNewFilterName={setNewFilterName}
        saveFilterName={saveFilterName}
        isDarkMode={isDarkMode}
        t={t}
      />

      {/* Filter Details Dialog */}
      <FilterDetailsDialog
        open={filterDetailsDialogOpen}
        onClose={() => setFilterDetailsDialogOpen(false)}
        onApply={handleApplyFilterFromMessage}
        isDarkMode={isDarkMode}
        filter={
          activeMessage?.filterSnapshot
            ? {
                ...activeMessage.filterSnapshot,
                isActive: false,
                createdAt:
                  activeMessage.timestamp?.toISOString() ||
                  new Date().toISOString(),
                scope: "chat" as const,
              }
            : null
        }
      />
    </Box>
  );
}
