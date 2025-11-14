// File Attachment Card Component
// Rich file preview cards for message attachments with thumbnail preview and action buttons

import React from "react";
import {
  Box,
  Paper,
  Typography,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  ErrorOutline as ErrorIcon,
  BrokenImage as BrokenImageIcon,
} from "@mui/icons-material";
import {
  DocumentFile,
  formatFileSize,
  getFileIconComponent,
} from "../types/document.types";
import { useFileActions } from "../hooks/useFileActions";
import { MoreOptionsMenu } from "./MoreOptionsMenu";
import { useTranslation } from "../contexts/TranslationContext";

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
  const { t } = useTranslation();
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
    <Box className="flex flex-col gap-6 mb-8">
      {files.map((file) => {
        const isNotFound = file.status === "error" || file.error;
        const { Icon, color } = isNotFound
          ? { Icon: BrokenImageIcon, color: isDarkMode ? "#ef4444" : "#dc2626" }
          : getFileIconComponent(file.mimeType);

        return (
          <Paper
            key={file.id}
            elevation={0}
            className={`flex items-center gap-6 p-6 rounded-xl transition-all duration-200 ${
              isNotFound
                ? isDarkMode
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-red-50 border border-red-200"
                : isDarkMode
                ? "bg-white/5 border border-white/10 hover:bg-white/8 hover:shadow-lg hover:shadow-black/30 hover:border-white/15"
                : "bg-black/2 border border-black/8 hover:bg-black/4 hover:shadow-lg hover:shadow-black/8 hover:border-black/12"
            }`}
          >
            {/* File Icon with Type-Specific Color */}
            <Box
              className="flex items-center justify-center w-12 h-12 rounded-[10px] flex-shrink-0"
              style={{
                backgroundColor: isNotFound
                  ? isDarkMode
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(220, 38, 38, 0.1)"
                  : isDarkMode
                  ? `${color}20`
                  : `${color}15`,
                color: isNotFound
                  ? isDarkMode
                    ? "#ef4444"
                    : "#dc2626"
                  : color,
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Box>

            {/* File Info */}
            <Box className="flex-1 min-w-0">
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                className={`text-[0.9375rem] mb-1 ${
                  isNotFound
                    ? isDarkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : isDarkMode
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                {file.name}
              </Typography>
              <Typography
                variant="caption"
                className={`text-[0.8125rem] flex items-center gap-1 ${
                  isNotFound
                    ? isDarkMode
                      ? "text-red-400/80"
                      : "text-red-600/80"
                    : isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {isNotFound ? (
                  <>
                    <ErrorIcon sx={{ fontSize: 14 }} />
                    {file.error || t("files.fileNotFound")}
                  </>
                ) : (
                  formatFileSize(file.size)
                )}
              </Typography>
            </Box>

            {/* Action Buttons */}
            {!isNotFound && (
              <Box className="flex gap-2 flex-shrink-0">
                <MoreOptionsMenu
                  items={[
                    {
                      id: "preview",
                      label: t("files.previewInNewTab"),
                      icon: <PreviewIcon sx={{ fontSize: 18 }} />,
                      onClick: (e) => {
                        e.stopPropagation();
                        handlePreview(file);
                      },
                    },
                    {
                      id: "download",
                      label: t("files.download"),
                      icon: <DownloadIcon sx={{ fontSize: 18 }} />,
                      onClick: (e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      },
                    },
                  ]}
                />
              </Box>
            )}
          </Paper>
        );
      })}
    </Box>
  );
};
