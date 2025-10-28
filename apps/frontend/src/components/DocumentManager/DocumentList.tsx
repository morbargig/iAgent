import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Skeleton,
  Checkbox,
  IconButton,
  Pagination,
  PaginationItem,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
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
import { useTranslation } from "../../contexts/TranslationContext";
import { DocumentCard } from "./DocumentCard";
import { ViewMode } from "./hooks/useDocumentUI";

interface DocumentListProps {
  searchQuery: string;
  documents: DocumentFile[];
  loading: boolean;
  viewMode: ViewMode;
  maxHeight?: number;
  selectionMode?: boolean;
  selectedDocuments?: DocumentFile[];
  page: number;
  totalPages: number;
  onDocumentClick: (document: DocumentFile) => void;
  onToggleSelection?: (document: DocumentFile) => void;
  onContextMenu: (event: React.MouseEvent, document: DocumentFile) => void;
  onDeleteClick: (document: DocumentFile) => void;
  onPageChange: (page: number) => void;
  isDocumentSelected: (document: DocumentFile) => boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  searchQuery,
  documents,
  loading,
  viewMode,
  maxHeight = 600,
  selectionMode = false,
  selectedDocuments = [],
  page,
  totalPages,
  onDocumentClick,
  onToggleSelection,
  onContextMenu,
  onDeleteClick,
  onPageChange,
  isDocumentSelected,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useTranslation();

  // Loading skeleton component
  if (loading) {
    return (
      <Box>
        {viewMode === "list" ? (
          // List view skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={60}
              sx={{ mb: 1, borderRadius: 1 }}
            />
          ))
        ) : (
          // Grid view skeletons
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Empty state
  if (!loading && documents.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          {t("files.noDocuments")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {/* Todo add no documents found message with description and search text */}
          {searchQuery
            ? t("files.noDocumentsFound", {
                searchText: searchQuery,
              })
            : null}
        </Typography>
      </Box>
    );
  }

  // Main document list/grid
  return (
    <>
      {viewMode === "list" ? (
        // List View
        <List sx={{ maxHeight, overflow: "auto" }}>
          {documents.map((document) => {
            const isSelected = isDocumentSelected(document);
            const { Icon, color } = getFileIconComponent(document.mimeType);
            return (
              <ListItem
                key={document.id}
                onClick={() => onDocumentClick(document)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  cursor: "pointer",
                  border: isSelected
                    ? `2px solid ${theme.palette.primary.main}`
                    : "1px solid transparent",
                  backgroundColor: isSelected
                    ? theme.palette.action.selected
                    : "transparent",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {selectionMode && (
                  <ListItemIcon>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelection?.(document)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItemIcon>
                )}
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: `${color}20` }}>
                    <Icon sx={{ color: color }} />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={document.name}
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {getFileTypeName(document.mimeType)} •{" "}
                      {formatFileSize(document.size)} •{" "}
                      {format(document.uploadedAt, "MMM dd, yyyy")}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
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
                    <IconButton
                      onClick={(e) => onContextMenu(e, document)}
                      size="small"
                    >
                      <MoreIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      ) : (
        // Grid View
        <Box sx={{ maxHeight, overflow: "auto" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {documents.map((document) => {
              const isSelected = isDocumentSelected(document);
              return (
                <DocumentCard
                  key={document.id}
                  document={document}
                  isSelected={isSelected}
                  selectionMode={selectionMode}
                  onDocumentClick={onDocumentClick}
                  onToggleSelection={onToggleSelection}
                  onContextMenu={onContextMenu}
                  onDeleteClick={onDeleteClick}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2} dir="ltr">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => onPageChange(newPage || 1)}
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                slots={{
                  previous: isRTL ? ArrowForward : ArrowBack,
                  next: isRTL ? ArrowBack : ArrowForward,
                }}
              />
            )}
          />
        </Box>
      )}
    </>
  );
};
