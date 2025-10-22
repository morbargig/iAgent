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

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        backgroundColor: isSelected
          ? theme.palette.action.selected
          : "transparent",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.light,
        },
        transition: "all 0.2s ease-in-out",
      }}
      onClick={() => onDocumentClick(document)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" alignItems="flex-start" mb={1}>
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelection?.(document)}
              onClick={(e) => e.stopPropagation()}
              sx={{ mr: 1, mt: -1 }}
              size="small"
            />
          )}
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            width="100%"
          >
            <Avatar
              sx={{
                bgcolor: `${color}20`,
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                mb: 2,
              }}
            >
              <Icon sx={{ color: color, fontSize: { xs: 24, sm: 28 } }} />
            </Avatar>
            <Tooltip title={document.name} placement="top">
              <Typography
                variant="body2"
                fontWeight="medium"
                textAlign="center"
                sx={{
                  mb: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  lineHeight: 1.2,
                }}
              >
                {document.name}
              </Typography>
            </Tooltip>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{
                display: "block",
                mb: 0.5,
              }}
            >
              {getFileTypeName(document.mimeType)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{
                display: "block",
                mb: 0.5,
              }}
            >
              {formatFileSize(document.size)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              {format(document.uploadedAt, "MMM dd, yyyy")}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      <CardActions sx={{ pt: 0, justifyContent: "center" }}>
        {selectionMode ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(document);
            }}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        ) : (
          <IconButton onClick={(e) => onContextMenu(e, document)} size="small">
            <MoreIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};
