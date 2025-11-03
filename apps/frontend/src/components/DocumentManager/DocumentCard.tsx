import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Avatar,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import {
  DocumentFile,
  formatFileSize,
  getFileIconComponent,
  getFileTypeName,
} from "../../types/document.types";

interface DocumentCardProps {
  document: DocumentFile;
  isSelected: boolean;
  selectionMode: boolean;
  onDocumentClick: (document: DocumentFile) => void;
  onToggleSelection?: (document: DocumentFile) => void;
  onContextMenu: (event: React.MouseEvent, document: DocumentFile) => void;
  onDeleteClick: (document: DocumentFile) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isSelected,
  selectionMode,
  onDocumentClick,
  onToggleSelection,
  onContextMenu,
  onDeleteClick,
}) => {
  const theme = useTheme();
  const { Icon, color } = getFileIconComponent(document.mimeType);
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        borderRadius: "12px",
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${
              isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.08)"
            }`,
        backgroundColor: isSelected
          ? isDarkMode
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)"
          : isDarkMode
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: isSelected
            ? isDarkMode
              ? "rgba(59, 130, 246, 0.15)"
              : "rgba(59, 130, 246, 0.08)"
            : isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.04)",
          borderColor: isSelected
            ? theme.palette.primary.main
            : isDarkMode
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(0, 0, 0, 0.12)",
          boxShadow: isDarkMode
            ? "0 4px 12px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.08)",
          transform: "translateY(-2px)",
        },
      }}
      onClick={() => onDocumentClick(document)}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          pb: 1,
          pt: 2,
          px: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {selectionMode && (
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelection?.(document)}
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
              color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
              "&.Mui-checked": {
                color: theme.palette.primary.main,
              },
            }}
            size="small"
          />
          
        )}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          width="100%"
          sx={{ mx: "auto", px: selectionMode ? 0 : 0.5 }}
        >
        
            <Avatar
              sx={{
                bgcolor: `${color}15`,
                width: { xs: 52, sm: 60 },
                height: { xs: 52, sm: 60 },
                mb: 1.5,
                border: `1px solid ${color}30`,
              }}
            >
              <Icon
                sx={{
                  color: color,
                  fontSize: { xs: 26, sm: 30 },
                }}
              />
            </Avatar>
            <Tooltip title={document.name} placement="top">
              <Typography
                variant="body2"
                fontWeight={500}
                textAlign="center"
                sx={{
                  mb: 0.75,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  lineHeight: 1.3,
                  color: isDarkMode
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(0, 0, 0, 0.87)",
                  fontSize: { xs: "13px", sm: "14px" },
                  px: 0.5,
                }}
              >
                {document.name}
              </Typography>
            </Tooltip>
            <Typography
              variant="caption"
              textAlign="center"
              sx={{
                display: "block",
                mb: 0.25,
                color: isDarkMode
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
                fontSize: "11px",
                fontWeight: 400,
              }}
            >
              {getFileTypeName(document.mimeType)}
            </Typography>
            <Typography
              variant="caption"
              textAlign="center"
              sx={{
                display: "block",
                mb: 0.25,
                color: isDarkMode
                  ? "rgba(255, 255, 255, 0.5)"
                  : "rgba(0, 0, 0, 0.5)",
                fontSize: "11px",
              }}
            >
              {formatFileSize(document.size)}
            </Typography>
            <Typography
              variant="caption"
              textAlign="center"
              sx={{
                display: "block",
                color: isDarkMode
                  ? "rgba(255, 255, 255, 0.5)"
                  : "rgba(0, 0, 0, 0.5)",
                fontSize: "10px",
              }}
            >
              {format(document.uploadedAt, "MMM dd, yyyy")}
            </Typography>
        </Box>
      </CardContent>
      <CardActions
        sx={{
          pt: 0,
          pb: 1,
          px: 1,
          justifyContent: "center",
          minHeight: "40px",
        }}
      >
        {selectionMode ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(document);
            }}
            size="small"
            sx={{
              color: theme.palette.error.main,
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(220, 38, 38, 0.1)"
                  : "rgba(220, 38, 38, 0.08)",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            onClick={(e) => onContextMenu(e, document)}
            size="small"
            sx={{
              color: isDarkMode
                ? "rgba(255, 255, 255, 0.6)"
                : "rgba(0, 0, 0, 0.6)",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
                color: isDarkMode
                  ? "rgba(255, 255, 255, 0.9)"
                  : "rgba(0, 0, 0, 0.87)",
              },
            }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};
