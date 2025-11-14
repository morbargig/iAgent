import {
  useEffect,
  useRef,
  useState,
  MouseEvent,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
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
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  ContactMail as ContactMailIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  OpenInNew as OpenInNewIcon,
  MenuBook as MenuBookIcon,
} from "@mui/icons-material";
import { type Message } from "@iagent/chat-types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { FileAttachmentCard } from "./FileAttachmentCard";
import { MessageAttachments } from "./MessageAttachments";
import {
  extractPlainTextFromMarkdown,
  copyToClipboard,
} from "../utils/textUtils";
import { useTranslation } from "../contexts/TranslationContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FilterDetailsDialog } from "./FilterDetailsDialog";
import { getApiUrl, getBaseApiUrl } from "../config/config";
import { environment } from "../environments/environment";
import { useAppLocalStorage, useAppSessionStorage } from "../hooks/storage";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import type { HeaderButtonId } from "../types/storage.types";

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
  onOpenAppDetails?: () => void; // Handler for opening app details dialog
  onSelectConversation?: (chatId: string) => void; // Handler for selecting/switching conversations
}

interface DraggableButtonProps {
  id: string;
  children: ReactNode;
  isDarkMode: boolean;
  theme: any;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragLeave: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  dragPosition: "before" | "after" | null;
}

const DraggableButton: React.FC<DraggableButtonProps> = ({
  id,
  children,
  isDarkMode,
  theme,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  isDragging,
  isDragOver,
  dragPosition,
}) => {
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <Box
      draggable
      onMouseDown={(e) => {
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        setHasDragged(false);
      }}
      onDragStart={(e) => {
        onDragStart(id);
        e.dataTransfer.effectAllowed = "move";
        setHasDragged(true);
      }}
      onDragEnd={() => {
        setTimeout(() => {
          setHasDragged(false);
          dragStartPosRef.current = null;
          onDragLeave();
        }, 0);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e, id);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(id);
        setHasDragged(false);
        dragStartPosRef.current = null;
        onDragLeave();
      }}
      onClick={(e) => {
        if (hasDragged && dragStartPosRef.current) {
          const currentPos = { x: e.clientX, y: e.clientY };
          const distance = Math.sqrt(
            Math.pow(currentPos.x - dragStartPosRef.current.x, 2) +
              Math.pow(currentPos.y - dragStartPosRef.current.y, 2)
          );
          if (distance > 5) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }}
      sx={{
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.3 : 1,
        transition: isDragging ? "none" : "transform 200ms, opacity 150ms",
        userSelect: "none",
        position: "relative",
        transform:
          isDragOver && dragPosition === "before"
            ? "translateX(-4px)"
            : isDragOver && dragPosition === "after"
              ? "translateX(4px)"
              : "translateX(0)",
        "&::before":
          isDragOver && dragPosition === "before"
            ? {
                content: '""',
                position: "absolute",
                left: "-2px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "2px",
                height: "24px",
                backgroundColor: theme.palette.primary.main,
                borderRadius: "1px",
                zIndex: 1,
              }
            : {},
        "&::after":
          isDragOver && dragPosition === "after"
            ? {
                content: '""',
                position: "absolute",
                right: "-2px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "2px",
                height: "24px",
                backgroundColor: theme.palette.primary.main,
                borderRadius: "1px",
                zIndex: 1,
              }
            : {},
      }}
    >
      {children}
    </Box>
  );
};

// Shared Header Component
const ChatHeader = ({
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  useMockMode,
  onToggleMockMode,
  onLogout,
  userEmail,
  onOpenAppDetails,
}: {
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
  onOpenAppDetails?: () => void;
}) => {
  const theme = useTheme();
  const { t, currentLang } = useTranslation();
  const enableLanguageSwitcher = useFeatureFlag("enableLanguageSwitcher");
  const enableContactUs = useFeatureFlag("enableContactUs");
  const enableAppDetails = useFeatureFlag("enableAppDetails");
  const enableDarkMode = useFeatureFlag("enableDarkMode");
  const [buttonOrder, setButtonOrder] = useAppLocalStorage(
    "header-buttons-order"
  );
  const [draggedButtonId, setDraggedButtonId] = useState<string | null>(null);
  const [dragOverButtonId, setDragOverButtonId] = useState<string | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [infoMenuAnchor, setInfoMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [contactMenuAnchor, setContactMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [swaggerMenuAnchor, setSwaggerMenuAnchor] =
    useState<HTMLElement | null>(null);

  const baseVersion =
    typeof __APP_VERSION__ !== "undefined"
      ? __APP_VERSION__
      : environment.app.version;
  const appVersion = `v.${baseVersion}-${environment.env}`;

  const getLocaleCode = () => {
    switch (currentLang) {
      case "he":
        return "he-IL";
      case "ar":
        return "ar-SA";
      default:
        return "en-US";
    }
  };

  const formatBuildDate = (dateString: string | undefined) => {
    const date = dateString
      ? new Date(dateString)
      : typeof __BUILD_DATE__ !== "undefined"
        ? new Date(__BUILD_DATE__)
        : new Date();

    const locale = getLocaleCode();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    return date.toLocaleString(locale, options);
  };

  const buildDate = formatBuildDate(environment.buildDate);

  const getSwaggerUrl = () => {
    const apiBaseUrl = environment.api.baseUrl || environment.apiUrl;
    try {
      const url = new URL(apiBaseUrl);
      return `${url.origin}/docs`;
    } catch {
      return "/docs";
    }
  };

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleInfoMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setInfoMenuAnchor(event.currentTarget);
  };

  const handleInfoMenuClose = () => {
    setInfoMenuAnchor(null);
  };

  const handleContactMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setContactMenuAnchor(event.currentTarget);
  };

  const handleContactMenuClose = () => {
    setContactMenuAnchor(null);
  };

  const handleSwaggerMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setSwaggerMenuAnchor(event.currentTarget);
  };

  const handleSwaggerMenuClose = () => {
    setSwaggerMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  const handleOpenAppDetails = () => {
    handleInfoMenuClose();
    if (onOpenAppDetails) {
      onOpenAppDetails();
    }
  };

  const [dragOverPosition, setDragOverPosition] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedButtonId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedButtonId || draggedButtonId === targetId) return;

    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = e.clientX < midpoint ? "before" : "after";
    setDragOverButtonId(targetId);
    setDragOverPosition({ id: targetId, position });
  };

  const handleDragLeave = () => {
    setDragOverButtonId(null);
    setDragOverPosition(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedButtonId || draggedButtonId === targetId) {
      setDraggedButtonId(null);
      setDragOverButtonId(null);
      setDragOverPosition(null);
      return;
    }

    const currentOrder = [...buttonOrder];
    const draggedIndex = currentOrder.indexOf(
      draggedButtonId as HeaderButtonId
    );
    const targetIndex = currentOrder.indexOf(targetId as HeaderButtonId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedButtonId(null);
      setDragOverButtonId(null);
      setDragOverPosition(null);
      return;
    }

    const position = dragOverPosition?.position || "before";
    currentOrder.splice(draggedIndex, 1);

    const newTargetIndex =
      position === "before"
        ? targetIndex
        : targetIndex + (draggedIndex < targetIndex ? 0 : 1);

    currentOrder.splice(newTargetIndex, 0, draggedButtonId as HeaderButtonId);
    setButtonOrder(currentOrder);
    setDraggedButtonId(null);
    setDragOverButtonId(null);
    setDragOverPosition(null);
  };

  const availableButtons: HeaderButtonId[] = [
    "theme",
    "language",
    "mockMode",
    "contact",
    "info",
    "swagger",
  ];
  const orderedButtons = buttonOrder.filter((id): id is HeaderButtonId =>
    availableButtons.includes(id as HeaderButtonId)
  );
  const missingButtons = availableButtons.filter(
    (id) => !buttonOrder.includes(id)
  );
  const finalOrder = [...orderedButtons, ...missingButtons];

  const renderButton = (buttonId: string) => {
    const isDragOver = dragOverButtonId === buttonId;
    const dragPosition =
      dragOverPosition?.id === buttonId ? dragOverPosition.position : null;

    switch (buttonId) {
      case "language":
        if (!enableLanguageSwitcher) return null;
        return (
          <DraggableButton
            key={buttonId}
            id={buttonId}
            isDarkMode={isDarkMode}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            isDragging={draggedButtonId === buttonId}
            isDragOver={isDragOver}
            dragPosition={dragPosition}
          >
            <LanguageSwitcher isDarkMode={isDarkMode} />
          </DraggableButton>
        );
      case "mockMode":
        return (
          <DraggableButton
            key={buttonId}
            id={buttonId}
            isDarkMode={isDarkMode}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            isDragging={draggedButtonId === buttonId}
            isDragOver={isDragOver}
            dragPosition={dragPosition}
          >
            <Tooltip
              title={
                useMockMode
                  ? t("common.disableMockApi")
                  : t("common.enableMockApi")
              }
            >
              <IconButton
                onClick={onToggleMockMode}
                className="no-rtl-transform"
                aria-label={
                  useMockMode
                    ? t("common.disableMockApi")
                    : t("common.enableMockApi")
                }
                sx={{
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
          </DraggableButton>
        );
      case "theme":
        if (!enableDarkMode) return null;
        return (
          <DraggableButton
            key={buttonId}
            id={buttonId}
            isDarkMode={isDarkMode}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            isDragging={draggedButtonId === buttonId}
            isDragOver={isDragOver}
            dragPosition={dragPosition}
          >
            <Tooltip title={isDarkMode ? t("theme.light") : t("theme.dark")}>
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
            </Tooltip>
          </DraggableButton>
        );
      case "info":
        if (!onOpenAppDetails || !enableAppDetails) return null;
        return (
          <DraggableButton
            key={buttonId}
            id={buttonId}
            isDarkMode={isDarkMode}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            isDragging={draggedButtonId === buttonId}
            isDragOver={isDragOver}
            dragPosition={dragPosition}
          >
            <Tooltip title={t("appDetails.title")}>
              <IconButton
                onClick={handleInfoMenuOpen}
                className="no-rtl-transform"
                aria-label={t("appDetails.title")}
                sx={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: infoMenuAnchor
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
                <InfoIcon sx={{ fontSize: "18px" }} />
              </IconButton>
            </Tooltip>
          </DraggableButton>
        );
      case "contact":
        if (!enableContactUs) return null;
        return (
          <DraggableButton
            key={buttonId}
            id={buttonId}
            isDarkMode={isDarkMode}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            isDragging={draggedButtonId === buttonId}
            isDragOver={isDragOver}
            dragPosition={dragPosition}
          >
            <Tooltip title={t("appDetails.contact")}>
              <IconButton
                onClick={handleContactMenuOpen}
                className="no-rtl-transform"
                aria-label={t("appDetails.contact")}
                sx={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: contactMenuAnchor
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
                <ContactMailIcon sx={{ fontSize: "18px" }} />
              </IconButton>
            </Tooltip>
          </DraggableButton>
        );
      case "swagger":
        return (
          <DraggableButton
            key={buttonId}
            id={buttonId}
            isDarkMode={isDarkMode}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            isDragging={draggedButtonId === buttonId}
            isDragOver={isDragOver}
            dragPosition={dragPosition}
          >
            <Tooltip title={t("appDetails.swaggerDocs")}>
              <IconButton
                onClick={handleSwaggerMenuOpen}
                className="no-rtl-transform"
                aria-label={t("appDetails.swaggerDocs")}
                sx={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: swaggerMenuAnchor
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
                <MenuBookIcon sx={{ fontSize: "18px" }} />
              </IconButton>
            </Tooltip>
          </DraggableButton>
        );
      default:
        return null;
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

      {/* Logo and App Name with Tooltip */}
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {appVersion}
            </Typography>
            <Typography variant="caption">{buildDate}</Typography>
          </Box>
        }
        arrow
        placement="bottom"
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="iAgent Logo"
            sx={{
              width: "32px",
              height: "32px",
              objectFit: "contain",
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
        </Box>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      {/* Draggable Buttons */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {finalOrder.map((buttonId) => renderButton(buttonId))}
      </Box>

      {/* Info Menu Popover */}
      {onOpenAppDetails && (
        <Popover
          open={Boolean(infoMenuAnchor)}
          anchorEl={infoMenuAnchor}
          onClose={handleInfoMenuClose}
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
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleOpenAppDetails}
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
                  <InfoIcon
                    sx={{
                      fontSize: "18px",
                      color: theme.palette.primary.main,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={t("appDetails.title")}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Popover>
      )}

      {/* Contact Menu Popover */}
      {enableContactUs && (
        <Popover
          open={Boolean(contactMenuAnchor)}
          anchorEl={contactMenuAnchor}
          onClose={handleContactMenuClose}
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
              minWidth: 240,
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
            <ListItem sx={{ padding: "12px 16px" }}>
              <ListItemText
                primary={environment.contact.teamName}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              />
            </ListItem>
            <Divider sx={{ margin: "4px 8px" }} />
            <ListItem disablePadding>
              <ListItemButton
                href={`mailto:${environment.contact.email}`}
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
                  <EmailIcon
                    sx={{
                      fontSize: "18px",
                      color: theme.palette.primary.main,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={environment.contact.email}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                href={`tel:${environment.contact.phone}`}
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
                  <PhoneIcon
                    sx={{
                      fontSize: "18px",
                      color: theme.palette.primary.main,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={environment.contact.phone}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Popover>
      )}

      {/* Swagger Menu Popover */}
      <Popover
        open={Boolean(swaggerMenuAnchor)}
        anchorEl={swaggerMenuAnchor}
        onClose={handleSwaggerMenuClose}
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
          <ListItem disablePadding>
            <ListItemButton
              component="a"
              href={getSwaggerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSwaggerMenuClose}
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
                <OpenInNewIcon
                  sx={{
                    fontSize: "18px",
                    color: theme.palette.primary.main,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={t("appDetails.swaggerDocs")}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>

      {/* User Menu - Separated from other buttons */}
      {userEmail && (
        <>
          <Box
            sx={{
              width: "2px",
              height: "24px",
              backgroundColor: theme.palette.divider,
              marginInline: "12px",
              borderRadius: "1px",
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
            backgroundColor: "transparent",
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
                  f.uploadDate || f.uploadedAt || new Date().getTime()
                ),
                userId: "user",
                status: "ready" as const,
                url: getApiUrl(`/files/${f.id}`),
                metadata: {},
              }))}
              isDarkMode={isDarkMode}
            />
          )}
          {/* Message Attachments from MongoDB (using attachment IDs) */}
          {message.metadata?.attachmentIds && Array.isArray(message.metadata.attachmentIds) && message.metadata.attachmentIds.length > 0 && (
            <MessageAttachments
              attachmentIds={message.metadata.attachmentIds as string[]}
              isDarkMode={isDarkMode}
            />
          )}

          <MarkdownRenderer
            content={message.content}
            parsed={message.parsed}
            isDarkMode={isDarkMode}
            onOpenReport={onOpenReport}
            sections={message.sections}
            currentSection={message.currentSection}
            section={
              message.metadata?.section as
                | "reasoning"
                | "tool-t"
                | "tool-h"
                | "tool-f"
                | "answer"
                | undefined
            }
            contentType={
              message.metadata?.contentType as
                | "citation"
                | "table"
                | "report"
                | "markdown"
                | undefined
            }
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

          <Tooltip title={t("message.delete")}>
            <IconButton
              onClick={() => onDeleteMessage?.(message.id)}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.text.secondary,
                borderRadius: "6px",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: theme.palette.error.main + "20",
                  color: theme.palette.error.main,
                },
              }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
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
          parsed={message.parsed}
          isDarkMode={isDarkMode}
          onOpenReport={onOpenReport}
          sections={message.sections}
          currentSection={message.currentSection}
          section={
            message.metadata?.section as
              | "reasoning"
              | "tool-t"
              | "tool-x"
              | "answer"
              | undefined
          }
          contentType={
            message.metadata?.contentType as
              | "citation"
              | "table"
              | "report"
              | "markdown"
              | undefined
          }
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

        {/* Delete Message Button */}
        <Tooltip title={t("message.delete")}>
          <IconButton
            onClick={() => onDeleteMessage?.(message.id)}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: theme.palette.text.secondary,
              borderRadius: "6px",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: theme.palette.error.main + "20",
                color: theme.palette.error.main,
              },
            }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
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

const OtherChatStreamingIndicator = ({
  isDarkMode,
  streamingConversationId,
  onSelectConversation,
}: {
  isDarkMode: boolean;
  streamingConversationId?: string | null;
  onSelectConversation?: (chatId: string) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleClick = () => {
    if (streamingConversationId && onSelectConversation) {
      onSelectConversation(streamingConversationId);
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        py: 2.5,
        px: 3,
        borderRadius: "16px",
        backgroundColor: isDarkMode
          ? "rgba(33, 150, 243, 0.08)"
          : "rgba(33, 150, 243, 0.06)",
        border: `1px solid ${
          isDarkMode ? "rgba(33, 150, 243, 0.25)" : "rgba(33, 150, 243, 0.2)"
        }`,
        animation: "pulseSubtle 2s ease-in-out infinite",
        cursor: streamingConversationId && onSelectConversation ? "pointer" : "default",
        transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": streamingConversationId && onSelectConversation ? {
          backgroundColor: isDarkMode
            ? "rgba(33, 150, 243, 0.12)"
            : "rgba(33, 150, 243, 0.09)",
          borderColor: isDarkMode
            ? "rgba(33, 150, 243, 0.35)"
            : "rgba(33, 150, 243, 0.3)",
          transform: "translateY(-1px)",
        } : {},
        "@keyframes pulseSubtle": {
          "0%, 100%": {
            opacity: 1,
            transform: "scale(1)",
          },
          "50%": {
            opacity: 0.95,
            transform: "scale(1.002)",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: isDarkMode
              ? "rgba(33, 150, 243, 0.15)"
              : "rgba(33, 150, 243, 0.12)",
            animation: "rotate 2s linear infinite",
            "@keyframes rotate": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        >
          <SwapHorizIcon
            sx={{
              fontSize: 20,
              color: isDarkMode ? "#64b5f6" : "#1976d2",
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? "#64b5f6" : "#1976d2",
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {t("chat.thinking")}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDarkMode
                ? "rgba(255, 255, 255, 0.6)"
                : "rgba(0, 0, 0, 0.6)",
              fontSize: "12px",
              lineHeight: 1.4,
              display: "block",
              mt: 0.5,
            }}
          >
            {t("chat.thinkingSubtext")}
          </Typography>
          {streamingConversationId && onSelectConversation && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.main,
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "underline",
                cursor: "pointer",
                display: "block",
                mt: 1,
                "&:hover": {
                  color: theme.palette.primary.dark,
                },
              }}
            >
              {t("chat.goToStreamingChat")}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isDarkMode ? "#64b5f6" : "#1976d2",
                opacity: 0.4,
                animation: `dotPulse 1.4s ease-in-out infinite ${i * 0.2}s`,
                "@keyframes dotPulse": {
                  "0%, 80%, 100%": {
                    opacity: 0.4,
                    transform: "scale(1)",
                  },
                  "40%": {
                    opacity: 1,
                    transform: "scale(1.2)",
                  },
                },
              }}
            />
          ))}
        </Box>
      </Box>
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
  onOpenAppDetails,
  streamingConversationId,
  onSelectConversation,
}: {
  isDarkMode: boolean;
  theme: any;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  useMockMode: boolean;
  onToggleMockMode: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
  onOpenAppDetails?: () => void;
  streamingConversationId?: string | null;
  onSelectConversation?: (chatId: string) => void;
}) => {
  const { t } = useTranslation();
  
  const showStreamingIndicator = Boolean(
    streamingConversationId && 
    typeof streamingConversationId === 'string' && 
    streamingConversationId.trim() !== '' &&
    onSelectConversation
  );
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
          onOpenAppDetails={onOpenAppDetails}
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
        
        {/* Streaming Indicator for Other Chat */}
        {showStreamingIndicator && (
          <Box
            sx={{
              mt: 2,
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <OtherChatStreamingIndicator
              isDarkMode={isDarkMode}
              streamingConversationId={streamingConversationId}
              onSelectConversation={onSelectConversation}
            />
          </Box>
        )}
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
  onOpenAppDetails,
  onSelectConversation,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Read streaming conversation ID from session storage (using write hook to ensure reactivity)
  const [streamingConversationId] = useAppSessionStorage('streaming-conversation-id');

  // Shared filter state for all messages
  const [filterInfoAnchor, setFilterInfoAnchor] = useState<HTMLElement | null>(
    null
  );
  const [activeMessage, setActiveMessage] = useState<any>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [filterDetailsDialogOpen, setFilterDetailsDialogOpen] = useState(false);

  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const filtered = messages.filter((msg) => {
      if (seen.has(msg.id)) {
        return false;
      }
      seen.add(msg.id);
      return true;
    });
    return filtered.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.id.localeCompare(b.id);
    });
  }, [messages]);

  const isCurrentChatStreaming = useMemo(() => {
    return (
      messages.some((m) => m.isStreaming) ||
      (isLoading && streamingConversationId === currentChatId)
    );
  }, [messages, isLoading, streamingConversationId, currentChatId]);

  const isOtherChatStreaming = useMemo(() => {
    // Don't show if current chat is streaming
    if (isCurrentChatStreaming) {
      return false;
    }
    
    // Must have a valid streaming conversation ID (not null, not undefined, not empty string)
    if (!streamingConversationId || typeof streamingConversationId !== 'string' || streamingConversationId.trim() === '') {
      return false;
    }
    
    // Show if:
    // - No current chat ID (blank new chat page: undefined, null, or empty string), OR
    // - Streaming is in a different chat
    const hasNoCurrentChat = !currentChatId || (typeof currentChatId === 'string' && currentChatId.trim() === '');
    const isDifferentChat = streamingConversationId !== currentChatId;
    return hasNoCurrentChat || isDifferentChat;
  }, [isCurrentChatStreaming, streamingConversationId, currentChatId]);

  const showFilterInfo = useMemo(() => {
    return Boolean(filterInfoAnchor);
  }, [filterInfoAnchor]);

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
        `${getBaseApiUrl()}/api/chats/filters/${activeMessage.filterSnapshot.filterId}`,
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

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      if (isCurrentChatStreaming) {
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
  }, [isCurrentChatStreaming]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
        onOpenAppDetails={onOpenAppDetails}
        streamingConversationId={streamingConversationId}
        onSelectConversation={onSelectConversation}
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
          onOpenAppDetails={onOpenAppDetails}
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
          paddingBottom: `${inputAreaHeight + (isCurrentChatStreaming ? 100 : 20)}px`,
          "@media (max-width: 600px)": {
            WebkitOverflowScrolling: "touch",
            padding: "16px 8px",
            paddingBottom: `${inputAreaHeight + (isCurrentChatStreaming ? 80 : 10)}px`,
          },
        }}
      >
        {/* Messages List */}
        <Box id="iagent-messages-list" className="iagent-messages-content">
          {uniqueMessages.map((message, index) => (
            <Box
              key={`${message.id}-${index}`}
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

        {/* Other Chat Streaming Indicator */}
        {isOtherChatStreaming && (
          <Box
            id="iagent-other-chat-indicator"
            className="iagent-loading-state"
          >
            <OtherChatStreamingIndicator
              isDarkMode={isDarkMode}
              streamingConversationId={streamingConversationId}
              onSelectConversation={onSelectConversation}
            />
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
