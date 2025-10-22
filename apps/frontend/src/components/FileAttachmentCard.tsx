// File Attachment Card Component
// Rich file preview cards for message attachments with thumbnail preview and action buttons

import React from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import {
  DocumentFile,
  formatFileSize,
  getFileIconComponent,
} from "../types/document.types";
import { useFileActions } from "../hooks/useFileActions";

interface FileAttachmentCardProps {
  files: DocumentFile[];
  isDarkMode?: boolean;
  onPreview?: (file: DocumentFile) => void;
  onDownload?: (file: DocumentFile) => void;
}

export const FileAttachmentCard: React.FC<FileAttachmentCardProps> = ({
  files,
  isDarkMode = false,
  onPreview,
  onDownload,
}) => {
  const theme = useTheme();
  const { handlePreview, handleDownload } = useFileActions({
    onPreviewCallback: onPreview,
    onDownloadCallback: onDownload,
    onError: (error, action) => {
      console.error(`${action} failed:`, error);
    },
  });

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
      {files.map((file) => {
        const { Icon, color } = getFileIconComponent(file.mimeType);

        return (
          <Paper
            key={file.id}
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: "12px",
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.02)",
              border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.08)",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            {/* File Icon with Type-Specific Color */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "10px",
                backgroundColor: isDarkMode ? `${color}20` : `${color}15`,
                color: color,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Box>

            {/* File Info */}
            <Box flex={1} minWidth={0}>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                  fontSize: "0.9375rem",
                  mb: 0.25,
                }}
              >
                {file.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  fontSize: "0.8125rem",
                }}
              >
                {formatFileSize(file.size)}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={0.5} flexShrink={0}>
              <Tooltip title="Preview in new tab">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(file);
                  }}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                    color: isDarkMode ? "#d1d5db" : "#6b7280",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <PreviewIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                    color: isDarkMode ? "#d1d5db" : "#6b7280",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <DownloadIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};
