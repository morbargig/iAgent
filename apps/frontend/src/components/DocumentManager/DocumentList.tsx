import React from "react";
import {
  Box,
  Typography,
  List,
  Avatar,
  Skeleton,
  Checkbox,
  Pagination,
  PaginationItem,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
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
import { MoreOptionsMenu } from "../MoreOptionsMenu";
import { useFileActions } from "../../hooks/useFileActions";

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
  onPreview?: (document: DocumentFile) => void;
  onDownload?: (document: DocumentFile) => void;
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
  onPreview,
  onDownload,
}) => {
  const theme = useTheme();
  const { t, isRTL } = useTranslation();
  
  const { handlePreview, handleDownload } = useFileActions({
    onPreviewCallback: onPreview,
    onDownloadCallback: onDownload,
    onError: (error, action) => {
      console.error(`${action} failed:`, error);
    },
  });

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
          // TODO: fix style
          // Grid view skeletons
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(3, 1fr)",
                sm: "repeat(4, 1fr)",
                md: "repeat(5, 1fr)",
                lg: "repeat(6, 1fr)",
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
              <Box
                key={document.id}
                onClick={() => onDocumentClick(document)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 1,
                  mb: 1,
                  p: 1,
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
                  flexDirection: "row", // Always left-to-right: checkbox → icon → text → actions
                  direction: "ltr", // Force LTR direction for this container
                }}
              >
                {/* 1. Checkbox - Always at start (left) */}
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggleSelection?.(document)}
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                  disabled={!selectionMode}
                  sx={{ 
                    opacity: selectionMode ? 1 : 0,
                    pointerEvents: selectionMode ? "auto" : "none",
                    marginRight: 1,
                    flexShrink: 0,
                  }}
                />
                
                {/* 2. File Icon - After checkbox */}
                <Avatar 
                  sx={{ 
                    bgcolor: `${color}20`, 
                    width: 40, 
                    height: 40,
                    marginRight: 2,
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ color: color, fontSize: 20 }} />
                </Avatar>
                
                {/* 3. File Name - Takes remaining space */}
                <Box sx={{ flex: 1, minWidth: 0, marginRight: 2 }}>
                  <Typography variant="body1" noWrap>
                    {document.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getFileTypeName(document.mimeType)} •{" "}
                    {formatFileSize(document.size)} •{" "}
                    {format(document.uploadedAt, "MMM dd, yyyy")}
                  </Typography>
                </Box>
                
                {/* 4. More Action Button - Always at end (right) */}
                <Box sx={{ flexShrink: 0 }}>
                  <MoreOptionsMenu
                    items={[
                      {
                        id: "preview",
                        label: "Preview in new tab",
                        icon: <PreviewIcon sx={{ fontSize: 18 }} />,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          handlePreview(document);
                        },
                      },
                      {
                        id: "download",
                        label: "Download",
                        icon: <DownloadIcon sx={{ fontSize: 18 }} />,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDownload(document);
                        },
                      },
                      ...(selectionMode
                        ? [
                            {
                              id: "delete",
                              label: "Delete",
                              icon: <DeleteIcon sx={{ fontSize: 18 }} />,
                              color: "error" as const,
                              onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                onDeleteClick(document);
                              },
                            },
                          ]
                        : [
                            {
                              id: "more",
                              label: "More options",
                              onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                onContextMenu(e as any, document);
                              },
                            },
                          ]),
                    ]}
                  />
                </Box>
              </Box>
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
                xs: "repeat(3, 1fr)",
                sm: "repeat(4, 1fr)",
                md: "repeat(5, 1fr)",
                lg: "repeat(6, 1fr)",
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
                  onPreview={onPreview}
                  onDownload={onDownload}
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
