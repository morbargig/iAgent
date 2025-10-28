import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Code as CodeIcon,
  Archive as ArchiveIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import { fileService } from "../services/fileService";

interface FileAttachmentProps {
  file: {
    id: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadDate: string;
  };
  onDownload?: (fileId: string, filename: string) => void;
  compact?: boolean;
  isDarkMode?: boolean;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  file,
  onDownload,
  compact = false,
  isDarkMode = false,
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload(file.id, file.filename);
    } else {
      // Default download behavior
      fileService.downloadFile(file.id, file.filename);
    }
  };

  const handlePreview = () => {
    fileService.previewFile(file.id);
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return <ImageIcon />;
    if (mimetype.startsWith("video/")) return <VideoIcon />;
    if (mimetype.startsWith("audio/")) return <AudioIcon />;
    if (mimetype.includes("pdf") || mimetype.includes("document"))
      return <DocumentIcon />;
    if (mimetype.includes("text") || mimetype.includes("code"))
      return <CodeIcon />;
    if (mimetype.includes("zip") || mimetype.includes("rar"))
      return <ArchiveIcon />;
    return <AttachFileIcon />;
  };

  const getFileColor = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return "success";
    if (mimetype.startsWith("video/")) return "error";
    if (mimetype.startsWith("audio/")) return "warning";
    if (mimetype.includes("pdf") || mimetype.includes("document"))
      return "primary";
    if (mimetype.includes("text") || mimetype.includes("code"))
      return "secondary";
    if (mimetype.includes("zip") || mimetype.includes("rar")) return "info";
    return "default";
  };

  if (compact) {
    return (
      <Chip
        icon={getFileIcon(file.mimetype)}
        label={file.filename}
        onClick={handleDownload}
        color={getFileColor(file.mimetype) as any}
        variant="outlined"
        size="small"
        sx={{
          cursor: "pointer",
          backgroundColor: isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.02)",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          color: isDarkMode ? "#ffffff" : "#374151",
          "&:hover": {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          },
        }}
      />
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 1,
            backgroundColor: "action.hover",
            color: "text.secondary",
          }}
        >
          {getFileIcon(file.mimetype)}
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {file.filename}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fileService.formatFileSize(file.size)} • {file.mimetype}
          </Typography>
        </Box>

        <Tooltip title="Preview file">
          <IconButton
            onClick={handlePreview}
            size="small"
            sx={{
              color: "primary.main",
              "&:hover": {
                backgroundColor: "primary.50",
              },
            }}
          >
            <PreviewIcon />
            kjhdsfkjhsfdk
          </IconButton>
        </Tooltip>

        <Tooltip title="Download file">
          <IconButton
            onClick={handleDownload}
            size="small"
            sx={{
              color: "primary.main",
              "&:hover": {
                backgroundColor: "primary.50",
              },
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};
