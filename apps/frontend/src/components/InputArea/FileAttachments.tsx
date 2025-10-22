import React from "react";
import { Box, Chip, Typography, CircularProgress } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { UploadingFile, AttachedFile } from "../../hooks/useFileHandling";
import { formatFileSize } from "../../types/document.types";

interface FileAttachmentsProps {
  uploadingFiles: UploadingFile[];
  attachedFiles: AttachedFile[];
  isDarkMode: boolean;
  textDirection: "ltr" | "rtl";
  onRemoveUploading: (tempId: string) => void;
  onRemoveAttached: (fileId: string) => void;
}

export const FileAttachments: React.FC<FileAttachmentsProps> = ({
  uploadingFiles,
  attachedFiles,
  isDarkMode,
  textDirection,
  onRemoveUploading,
  onRemoveAttached,
}) => {
  // Only render if there are files to show
  if (uploadingFiles.length === 0 && attachedFiles.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        padding: "12px 16px",
        borderBottom: `1px solid ${isDarkMode ? "#565869" : "#d1d5db"}`,
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {/* Uploading files */}
        {uploadingFiles.map((file, index) => (
          <Chip
            key={`uploading-${file.tempId}-${index}`}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "13px",
                  }}
                >
                  {file.localFile.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? "#a3a3a3" : "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  ({formatFileSize(file.localFile.size)})
                </Typography>
                {file.status === "uploading" && (
                  <>
                    <CircularProgress
                      size={12}
                      thickness={5}
                      sx={{
                        color: "#3b82f6",
                        me: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#3b82f6",
                        fontSize: "11px",
                        marginInlineEnd: 0.3,
                      }}
                    >
                      {file.progress}%
                    </Typography>
                  </>
                )}
                {file.status === "error" && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#ef4444",
                      fontSize: "11px",
                      marginInlineEnd: 0.5,
                    }}
                  >
                    ✕
                  </Typography>
                )}
              </Box>
            }
            onDelete={() => onRemoveUploading(file.tempId)}
            deleteIcon={<CloseIcon className="no-rtl-transform" />}
            sx={{
              backgroundColor: isDarkMode ? "#343541" : "#e5e7eb",
              color: isDarkMode ? "#ececf1" : "#374151",
              height: "32px",
              direction: textDirection,
              border:
                file.status === "error"
                  ? "1px solid #ef4444"
                  : file.status === "uploading"
                    ? "1px solid #3b82f6"
                    : "none",
              "& .MuiChip-label": {
                padding: "0 12px",
                direction: textDirection,
              },
              overflow: "hidden",
              "& .MuiChip-deleteIcon": {
                visibility: "visible",
                opacity: 1,
                display: "flex",
                margin: "0 4px",
                color: isDarkMode ? "#a3a3a3" : "#6b7280",
                "&:hover": {
                  color: isDarkMode ? "#ececf1" : "#374151",
                },
              },
              '[dir="rtl"] &': {
                "& .MuiChip-deleteIcon": {
                  order: -1,
                },
                "& .MuiChip-label": {
                  order: 1,
                },
              },
            }}
          />
        ))}

        {/* Attached files (uploaded or from document manager) */}
        {attachedFiles.map((file, index) => (
          <Chip
            key={`attached-${file.id}-${index}`}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "13px",
                  }}
                >
                  {file.filename}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? "#a3a3a3" : "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  ({formatFileSize(file.size)})
                </Typography>
                {file.source === "document-manager" && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#10b981",
                      fontSize: "10px",
                      marginInlineStart: 0.5,
                    }}
                  >
                    ✓
                  </Typography>
                )}
              </Box>
            }
            onDelete={() => onRemoveAttached(file.id)}
            deleteIcon={<CloseIcon className="no-rtl-transform" />}
            sx={{
              backgroundColor: isDarkMode ? "#343541" : "#e5e7eb",
              color: isDarkMode ? "#ececf1" : "#374151",
              height: "32px",
              direction: textDirection,
              border:
                file.source === "document-manager"
                  ? "1px solid #10b981"
                  : "1px solid #3b82f6",
              "& .MuiChip-label": {
                padding: "0 12px",
                direction: textDirection,
              },
              overflow: "hidden",
              "& .MuiChip-deleteIcon": {
                visibility: "visible",
                opacity: 1,
                display: "flex",
                margin: "0 4px",
                color: isDarkMode ? "#a3a3a3" : "#6b7280",
                "&:hover": {
                  color: isDarkMode ? "#ececf1" : "#374151",
                },
              },
              '[dir="rtl"] &': {
                "& .MuiChip-deleteIcon": {
                  order: -1,
                },
                "& .MuiChip-label": {
                  order: 1,
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
