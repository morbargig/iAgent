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
              className="mb-4 rounded"
            />
          ))
        ) : (
          // TODO: fix style
          // Grid view skeletons
          <Box className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={200}
                className="rounded"
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
      <Box className="text-center py-16">
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
        <List className="overflow-auto" style={{ maxHeight }}>
          {documents.map((document) => {
            const isSelected = isDocumentSelected(document);
            const { Icon, color } = getFileIconComponent(document.mimeType);
            return (
              <Box
                key={document.id}
                onClick={() => onDocumentClick(document)}
                className={`flex items-center rounded mb-4 p-4 cursor-pointer flex-row direction-ltr ${
                  isSelected
                    ? "border-2"
                    : "border border-transparent"
                } ${
                  isSelected
                    ? "bg-blue-500/10 dark:bg-blue-500/10"
                    : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{
                  borderColor: isSelected ? theme.palette.primary.main : undefined,
                }}
              >
                {/* 1. Checkbox - Always at start (left) */}
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggleSelection?.(document)}
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                  disabled={!selectionMode}
                  className={`mr-4 flex-shrink-0 ${
                    selectionMode ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                />
                
                {/* 2. File Icon - After checkbox */}
                <Avatar 
                  className="w-10 h-10 mr-8 flex-shrink-0"
                  style={{ 
                    backgroundColor: `${color}20`,
                  }}
                >
                  <Icon sx={{ color: color, fontSize: 20 }} />
                </Avatar>
                
                {/* 3. File Name - Takes remaining space */}
                <Box className="flex-1 min-w-0 mr-8">
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
                <Box className="flex-shrink-0">
                  <MoreOptionsMenu
                    items={[
                      {
                        id: "preview",
                        label: t("files.previewInNewTab"),
                        icon: <PreviewIcon sx={{ fontSize: 18 }} />,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          handlePreview(document);
                        },
                      },
                      {
                        id: "download",
                        label: t("files.download"),
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
                              label: t("files.delete"),
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
                              label: t("files.moreOptions"),
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
        <Box className="overflow-auto" style={{ maxHeight }}>
          <Box className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-8">
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
        <Box className="flex justify-center mt-8 dir-ltr">
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
