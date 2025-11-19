import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Checkbox,
  Pagination,
  PaginationItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Paper,
  IconButton,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
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
  onEditClick?: (document: DocumentFile) => void;
  onSelectAll?: () => void;
  areAllVisibleSelected?: boolean;
  areSomeVisibleSelected?: boolean;
  onBulkDeleteClick?: () => void;
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
  onEditClick,
  onSelectAll,
  areAllVisibleSelected = false,
  areSomeVisibleSelected = false,
  onBulkDeleteClick,
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
        // Table View
        <TableContainer
          component={Paper}
          sx={{ maxHeight, overflow: "auto" }}
          elevation={0}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {selectionMode && onSelectAll && documents.length > 0 && (
                  <TableCell
                    padding="checkbox"
                    sx={{
                      backgroundColor: theme.palette.mode === "dark" 
                        ? "rgba(255, 255, 255, 0.05)" 
                        : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Tooltip
                      title={
                        areAllVisibleSelected
                          ? t("files.deselectAll")
                          : t("files.selectAll")
                      }
                      arrow
                    >
                      <Checkbox
                        checked={areAllVisibleSelected}
                        indeterminate={
                          areSomeVisibleSelected && !areAllVisibleSelected
                        }
                        onChange={onSelectAll}
                        size="small"
                        inputProps={{
                          "aria-label": areAllVisibleSelected
                            ? t("files.deselectAll")
                            : t("files.selectAll"),
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.mode === "dark" 
                      ? "rgba(255, 255, 255, 0.05)" 
                      : "rgba(0, 0, 0, 0.02)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                  }}
                >
                  {t("files.name")}
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.mode === "dark" 
                      ? "rgba(255, 255, 255, 0.05)" 
                      : "rgba(0, 0, 0, 0.02)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                  }}
                >
                  {t("files.type")}
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.mode === "dark" 
                      ? "rgba(255, 255, 255, 0.05)" 
                      : "rgba(0, 0, 0, 0.02)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                  }}
                >
                  {t("files.size")}
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.mode === "dark" 
                      ? "rgba(255, 255, 255, 0.05)" 
                      : "rgba(0, 0, 0, 0.02)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                  }}
                >
                  {t("files.date")}
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.mode === "dark" 
                      ? "rgba(255, 255, 255, 0.05)" 
                      : "rgba(0, 0, 0, 0.02)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    width: 48,
                  }}
                >
                  {selectionMode && selectedDocuments.length > 0 && onBulkDeleteClick && (
                    <Tooltip title={t("files.deleteSelected")} arrow>
                      <IconButton
                        size="small"
                        onClick={onBulkDeleteClick}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => {
                const isSelected = isDocumentSelected(document);
                const { Icon, color } = getFileIconComponent(document.mimeType);
                return (
                  <TableRow
                    key={document.id}
                    onClick={() => onDocumentClick(document)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? theme.palette.action.selected
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? theme.palette.action.selected
                          : theme.palette.action.hover,
                      },
                    }}
                  >
                    {selectionMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onToggleSelection?.(document)}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: `${color}20`,
                          }}
                        >
                          <Icon sx={{ color: color, fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          {document.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getFileTypeName(document.mimeType)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(document.size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(document.uploadedAt, "MMM dd, yyyy")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box onClick={(e) => e.stopPropagation()}>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Grid View
        <Box>
          {selectionMode && onSelectAll && documents.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                pb: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Tooltip
                title={
                  areAllVisibleSelected
                    ? t("files.deselectAll")
                    : t("files.selectAll")
                }
                arrow
              >
                <Checkbox
                  checked={areAllVisibleSelected}
                  indeterminate={
                    areSomeVisibleSelected && !areAllVisibleSelected
                  }
                  onChange={onSelectAll}
                  size="small"
                  inputProps={{
                    "aria-label": areAllVisibleSelected
                      ? t("files.deselectAll")
                      : t("files.selectAll"),
                  }}
                />
              </Tooltip>
            </Box>
          )}
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
                    onEditClick={onEditClick}
                  />
                );
              })}
            </Box>
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
