import React from "react";
import {
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Stop as StopIcon,
  KeyboardArrowUp as ArrowUpIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import FolderIcon from "@mui/icons-material/Folder";
import { FILE_UPLOAD_CONFIG } from "../../config/fileUpload";
import { UploadingFile, AttachedFile } from "../../hooks/useFileHandling";

interface AttachmentButtonProps {
  showAttachmentButton: boolean;
  disabled: boolean;
  isDarkMode: boolean;
  uploadingFiles: UploadingFile[];
  attachedFiles: AttachedFile[];
  fileMenuOpen: boolean;
  fileMenuAnchor: HTMLElement | null;
  t: (key: string, params?: Record<string, unknown>) => string;
  onFileMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
  onFileMenuClose: () => void;
  onQuickUpload?: () => void;
  onOpenDocumentManager?: () => void;
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  showAttachmentButton,
  disabled,
  isDarkMode,
  uploadingFiles,
  attachedFiles,
  fileMenuOpen,
  fileMenuAnchor,
  t,
  onFileMenuClick,
  onFileMenuClose,
  onQuickUpload,
  onOpenDocumentManager,
}) => {
  if (!showAttachmentButton) return null;

  const totalFiles = uploadingFiles.length + attachedFiles.length;
  const maxFilesReached = totalFiles >= FILE_UPLOAD_CONFIG.MAX_FILE_COUNT;

  return (
    <>
      <Tooltip
        title={
          maxFilesReached
            ? t("files.maxFilesReached", {
                count: FILE_UPLOAD_CONFIG.MAX_FILE_COUNT,
              })
            : t("input.attachFilesTooltip")
        }
        arrow
      >
        <Badge
          badgeContent={totalFiles}
          color="primary"
          invisible={totalFiles === 0}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.625rem",
              height: "16px",
              minWidth: "16px",
              padding: "0 4px",
            },
          }}
        >
          <IconButton
            onClick={onFileMenuClick}
            disabled={disabled || maxFilesReached}
            sx={{
              width: "32px",
              height: "32px",
              backgroundColor: "transparent",
              color: isDarkMode ? "#8e8ea0" : "#6b7280",
              borderRadius: "16px",
              transition: "all 0.2s ease",
              opacity: maxFilesReached ? 0.5 : 1,
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.04)",
                color: isDarkMode ? "#ffffff" : "#374151",
              },
              "&.Mui-disabled": {
                color: isDarkMode ? "#565869" : "#9ca3af",
              },
            }}
          >
            <AttachFileIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Badge>
      </Tooltip>

      <Menu
        anchorEl={fileMenuAnchor}
        open={fileMenuOpen}
        onClose={onFileMenuClose}
        transformOrigin={{
          horizontal: "left",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "left",
          vertical: "bottom",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: "8px",
              boxShadow: isDarkMode
                ? "0 4px 12px rgba(0, 0, 0, 0.5)"
                : "0 4px 12px rgba(0, 0, 0, 0.15)",
              backgroundColor: isDarkMode ? "#2f3136" : "#ffffff",
            },
          },
        }}
      >
        {onQuickUpload && (
        <MenuItem
          onClick={onQuickUpload}
          sx={{
            color: isDarkMode ? "#dcddde" : "#000000",
            "&:hover": {
              backgroundColor: isDarkMode ? "#40444b" : "#f3f4f6",
            },
          }}
        >
          <ListItemIcon>
            <CloudUploadIcon
              fontSize="small"
              sx={{ color: isDarkMode ? "#dcddde" : "#000000" }}
            />
          </ListItemIcon>
          <ListItemText>{t("files.quickUpload")}</ListItemText>
        </MenuItem>
        )}
        {onOpenDocumentManager && (
        <MenuItem
          onClick={onOpenDocumentManager}
          sx={{
            color: isDarkMode ? "#dcddde" : "#000000",
            "&:hover": {
              backgroundColor: isDarkMode ? "#40444b" : "#f3f4f6",
            },
          }}
        >
          <ListItemIcon>
            <FolderIcon
              fontSize="small"
              sx={{ color: isDarkMode ? "#dcddde" : "#000000" }}
            />
          </ListItemIcon>
          <ListItemText>{t("files.documentManager")}</ListItemText>
        </MenuItem>
        )}
      </Menu>
    </>
  );
};

interface SubmitButtonProps {
  canSend: boolean;
  showStopButton: boolean;
  disabled: boolean;
  isDarkMode: boolean;
  onSubmit: () => void;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  canSend,
  showStopButton,
  disabled,
  isDarkMode,
  onSubmit,
}) => {
  const isSendDisabled = !canSend && !showStopButton;

  const getSendButtonStyles = () => {
    if (showStopButton) {
      return {
        backgroundColor: isDarkMode ? "#565869" : "#f3f4f6",
        color: isDarkMode ? "#ffffff" : "#374151",
        hoverBackgroundColor: isDarkMode ? "#6b7280" : "#e5e7eb",
      };
    }
    if (canSend) {
      return {
        backgroundColor: "#000000",
        color: "#ffffff",
        hoverBackgroundColor: "#333333",
      };
    }
    return {
      backgroundColor: isDarkMode ? "#40414f" : "#f7f7f8",
      color: isDarkMode ? "#6b7280" : "#9ca3af",
      hoverBackgroundColor: isDarkMode ? "#4a4b57" : "#eeeeee",
    };
  };

  const sendButtonStyles = getSendButtonStyles();

  return (
    <IconButton
      id="iagent-send-button"
      className={`iagent-submit-button ${showStopButton ? "iagent-stop-mode" : "iagent-send-mode"}`}
      onClick={onSubmit}
      disabled={isSendDisabled}
      sx={{
        width: "32px",
        height: "32px",
        backgroundColor: sendButtonStyles.backgroundColor,
        color: sendButtonStyles.color,
        borderRadius: "50%",
        border: "none",
        boxShadow: "none",
        minWidth: "auto",
        padding: 0,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: sendButtonStyles.hoverBackgroundColor,
          transform: canSend || showStopButton ? "scale(1.1)" : "none",
          boxShadow:
            canSend || showStopButton
              ? "0 2px 8px rgba(0, 0, 0, 0.2)"
              : "none",
        },
        "&:disabled": {
          backgroundColor: isDarkMode ? "#40414f" : "#f7f7f8",
          color: isDarkMode ? "#6b7280" : "#9ca3af",
          transform: "none",
          boxShadow: "none",
        },
        "&:focus": {
          outline: "none",
          boxShadow: canSend ? "0 0 0 2px rgba(0, 0, 0, 0.2)" : "none",
        },
      }}
    >
      {showStopButton ? (
        <StopIcon sx={{ fontSize: 18 }} />
      ) : (
        <ArrowUpIcon sx={{ fontSize: 20, fontWeight: "bold" }} />
      )}
    </IconButton>
  );
};
