import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Checkbox,
  Tooltip,
} from "@mui/material";
import {
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import {
  DocumentFile,
  formatFileSize,
  getFileIconComponent,
  getFileTypeName,
} from "../../types/document.types";
import { useFileActions } from "../../hooks/useFileActions";
import { MoreOptionsMenu, MoreOptionsMenuItem } from "../MoreOptionsMenu";
import { useTranslation } from "../../contexts/TranslationContext";

interface DocumentCardProps {
  document: DocumentFile;
  isSelected: boolean;
  selectionMode: boolean;
  onDocumentClick: (document: DocumentFile) => void;
  onToggleSelection?: (document: DocumentFile) => void;
  onContextMenu: (event: React.MouseEvent, document: DocumentFile) => void;
  onDeleteClick: (document: DocumentFile) => void;
  onPreview?: (document: DocumentFile) => void;
  onDownload?: (document: DocumentFile) => void;
  onEditClick?: (document: DocumentFile) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isSelected,
  selectionMode,
  onDocumentClick,
  onToggleSelection,
  onContextMenu,
  onDeleteClick,
  onPreview,
  onDownload,
  onEditClick,
}) => {
  const theme = useTheme();
  const { Icon, color } = getFileIconComponent(document.mimeType);
  const isDarkMode = theme.palette.mode === "dark";
  const { t } = useTranslation();

  const { handlePreview, handleDownload } = useFileActions({
    onPreviewCallback: onPreview,
    onDownloadCallback: onDownload,
    onError: (error, action) => {
      console.error(`${action} failed:`, error);
    },
  });

  const menuItems: MoreOptionsMenuItem[] = [
    {
      id: "preview",
      label: t("files.previewInNewTab"),
      icon: <PreviewIcon sx={{ fontSize: 18 }} />,
      onClick: (e) => {
        e.stopPropagation();
        handlePreview(document);
      },
    },
    {
      id: "download",
      label: t("files.download"),
      icon: <DownloadIcon sx={{ fontSize: 18 }} />,
      onClick: (e) => {
        e.stopPropagation();
        handleDownload(document);
      },
    },
    ...(document.mimeType === 'text/plain' && onEditClick
      ? [
          {
            id: "edit",
            label: t("files.editText"),
            icon: <EditIcon sx={{ fontSize: 18 }} />,
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              onEditClick(document);
            },
          },
        ]
      : []),
    {
      id: "delete",
      label: t("files.delete"),
      icon: <DeleteIcon sx={{ fontSize: 18 }} />,
      color: "error",
      onClick: (e) => {
        e.stopPropagation();
        onDeleteClick(document);
      },
    },
  ];

  return (
    <Card
      elevation={0}
      className={`h-full flex flex-col cursor-pointer rounded-xl transition-all duration-200 ease-in-out ${
        isSelected
          ? isDarkMode
            ? "bg-blue-500/10 border-2 border-blue-500 hover:bg-blue-500/15 hover:border-blue-500"
            : "bg-blue-500/5 border-2 border-blue-500 hover:bg-blue-500/8 hover:border-blue-500"
          : isDarkMode
          ? "bg-white/3 border border-white/10 hover:bg-white/5 hover:border-white/15 hover:shadow-lg hover:shadow-black/30"
          : "bg-black/2 border border-black/8 hover:bg-black/4 hover:border-black/12 hover:shadow-lg hover:shadow-black/8"
      } hover:-translate-y-0.5`}
      style={{
        borderColor: isSelected ? theme.palette.primary.main : undefined,
      }}
      onClick={() => onDocumentClick(document)}
    >
      <CardContent className="flex-grow pb-6 pt-4 px-4 flex flex-col relative">
        <Box className="flex items-center justify-between mb-4">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelection?.(document)}
              onClick={(e) => e.stopPropagation()}
              className={`z-10 ${
                isDarkMode ? "text-white/70" : "text-black/60"
              }`}
              sx={{
                "&.Mui-checked": {
                  color: theme.palette.primary.main,
                },
                padding: "4px",
              }}
              size="small"
            />
          )}
          {!selectionMode && <Box sx={{ width: 32 }} />}
          <MoreOptionsMenu
            items={menuItems}
            buttonPosition="relative"
            buttonPositionStyles={{}}
          />
        </Box>
        <Box className="flex flex-col items-center justify-center w-full flex-grow">
          <Avatar
            className="mb-4 w-[56px] h-[56px] sm:w-[64px] sm:h-[64px]"
            style={{
              backgroundColor: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon
              sx={{
                color: color,
                fontSize: { xs: 28, sm: 32 },
              }}
            />
          </Avatar>
          <Tooltip title={document.name} placement="top">
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="center"
              className={`mb-2 line-clamp-2 break-words leading-[1.4] text-[13px] sm:text-[14px] px-1 ${
                isDarkMode ? "text-white/90" : "text-black/87"
              }`}
            >
              {document.name}
            </Typography>
          </Tooltip>
          <Box className="flex flex-col items-center gap-0.5 mt-auto">
            <Typography
              variant="caption"
              textAlign="center"
              className={`text-[11px] font-medium ${
                isDarkMode ? "text-white/70" : "text-black/70"
              }`}
            >
              {getFileTypeName(document.mimeType)}
            </Typography>
            <Typography
              variant="caption"
              textAlign="center"
              className={`text-[10px] ${
                isDarkMode ? "text-white/55" : "text-black/55"
              }`}
            >
              {formatFileSize(document.size)} • {format(document.uploadedAt, "MMM dd, yyyy")}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
