// Document Manager Component
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  InputAdornment,
  Skeleton,
  Checkbox,
} from "@mui/material";
import {
  Search as SearchIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import {
  DocumentFile,
  DocumentSearchFilters,
  formatFileSize,
  getFileIconComponent,
  getFileTypeName,
} from "../types/document.types";
import { DocumentService } from "../services/documentService";
import { useTranslation } from "../contexts/TranslationContext";

interface DocumentManagerProps {
  onDocumentSelect?: (document: DocumentFile) => void;
  onDocumentPreview?: (document: DocumentFile) => void;
  onDocumentDelete?: (document: DocumentFile) => void;
  onToggleSelection?: (document: DocumentFile) => void;
  onClearSelection?: () => void;
  selectionMode?: boolean;
  selectedDocuments?: DocumentFile[];
  maxHeight?: number;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

type ViewMode = "list" | "grid";

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  onDocumentSelect,
  onDocumentPreview,
  onDocumentDelete,
  onToggleSelection,
  onClearSelection,
  selectionMode = false,
  selectedDocuments = [],
  maxHeight = 600,
  showUploadButton = true,
  onUploadClick,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [documentService] = useState(() => new DocumentService());

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters] = useState<DocumentSearchFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    document?: DocumentFile;
  }>({ open: false });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    open: boolean;
    documents: DocumentFile[];
  }>({ open: false, documents: [] });
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    document: DocumentFile;
  } | null>(null);

  const loadDocuments = useCallback(
    async (resetPage = false) => {
      setLoading(true);
      setError(null);
      try {
        const currentPage = resetPage ? 1 : page;
        const response = await documentService.getDocuments(currentPage, 10, {
          ...filters,
          query: searchQuery || undefined,
        });
        setDocuments(response.documents);
        setTotalPages(Math.ceil(response.total / 10));
        setTotalDocuments(response.total);
        if (resetPage) setPage(1);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setLoading(false);
      }
    },
    [page, filters, searchQuery, documentService]
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleDocumentClick = (document: DocumentFile) => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection(document);
    } else if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  const handleDownloadDocument = async (documentFile: DocumentFile) => {
    try {
      const blob = await documentService.downloadDocument(documentFile.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = documentFile.name;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDeleteDocument = async (document: DocumentFile) => {
    try {
      await documentService.deleteDocument(document.id);
      onDocumentDelete?.(document);
      await loadDocuments();
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleBulkDelete = async (documents: DocumentFile[]) => {
    try {
      // Delete all selected documents
      await Promise.all(
        documents.map((doc) => documentService.deleteDocument(doc.id))
      );

      // Notify parent of deletions
      documents.forEach((doc) => onDocumentDelete?.(doc));

      // Clear selected documents in parent component
      onClearSelection?.();

      // Refresh the document list
      await loadDocuments();
      setBulkDeleteDialog({ open: false, documents: [] });
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialog({ open: true, documents: selectedDocuments });
  };

  const handleContextMenu = (
    event: React.MouseEvent,
    document: DocumentFile
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget as HTMLElement, document });
  };

  const isDocumentSelected = (document: DocumentFile) => {
    return selectedDocuments.some((d) => d.id === document.id);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">
          {t("documents")} ({totalDocuments})
          {selectionMode && selectedDocuments.length > 0 && (
            <Typography
              component="span"
              variant="body2"
              color="primary"
              sx={{ ml: 1 }}
            >
              ({selectedDocuments.length} selected)
            </Typography>
          )}
        </Typography>
        <Box display="flex" gap={1}>
          {showUploadButton && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onUploadClick}
            >
              {t("upload")}
            </Button>
          )}
          <IconButton onClick={() => loadDocuments(true)}>
            <RefreshIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          >
            {viewMode === "list" ? <GridViewIcon /> : <ListViewIcon />}
          </IconButton>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder={t("searchDocuments")}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton onClick={() => handleSearch("")} size="small">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={60}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      )}

      {!loading && documents.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {t("noDocuments")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("uploadFirstDocument")}
          </Typography>
        </Box>
      )}

      {/* Bulk Actions Toolbar - only show in selection mode when files are selected */}
      {selectionMode && selectedDocuments.length > 0 && (
        <Box
          sx={{
            p: 2,
            bgcolor: theme.palette.action.selected,
            borderRadius: 1,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" color="primary">
            {selectedDocuments.length}{" "}
            {selectedDocuments.length === 1 ? "file" : "files"} selected
          </Typography>
          <Box>
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleBulkDeleteClick}
              color="error"
              variant="outlined"
              size="small"
            >
              Delete Selected
            </Button>
          </Box>
        </Box>
      )}

      {!loading && documents.length > 0 && (
        <>
          <List sx={{ maxHeight, overflow: "auto" }}>
            {documents.map((document) => {
              const isSelected = isDocumentSelected(document);
              const { Icon, color } = getFileIconComponent(document.mimeType);
              return (
                <ListItem
                  key={document.id}
                  onClick={() => handleDocumentClick(document)}
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
                    "&:hover": { backgroundColor: theme.palette.action.hover },
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
                          setDeleteDialog({ open: true, document });
                        }}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={(e) => handleContextMenu(e, document)}
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

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage || 1)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            onDocumentPreview?.(menuAnchor!.document);
            setMenuAnchor(null);
          }}
        >
          <PreviewIcon sx={{ mr: 1 }} />
          {t("preview")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDownloadDocument(menuAnchor!.document);
            setMenuAnchor(null);
          }}
        >
          <DownloadIcon sx={{ mr: 1 }} />
          {t("download")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialog({ open: true, document: menuAnchor!.document });
            setMenuAnchor(null);
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          {t("delete")}
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
      >
        <DialogTitle>{t("deleteDocument")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("deleteDocumentConfirm", {
              name: deleteDialog.document?.name || "this document",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() =>
              deleteDialog.document &&
              handleDeleteDocument(deleteDialog.document)
            }
            color="error"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog.open}
        onClose={() => setBulkDeleteDialog({ open: false, documents: [] })}
      >
        <DialogTitle>{t("deleteMultipleDocuments")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("deleteMultipleDocumentsConfirm", {
              count: bulkDeleteDialog.documents.length,
            })}
          </Typography>
          {bulkDeleteDialog.documents.length > 0 && (
            <Box sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
              {bulkDeleteDialog.documents.map((doc) => (
                <Typography key={doc.id} variant="body2" sx={{ py: 0.5 }}>
                  • {doc.name}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkDeleteDialog({ open: false, documents: [] })}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => handleBulkDelete(bulkDeleteDialog.documents)}
            color="error"
            variant="contained"
          >
            {t("deleteAll")} ({bulkDeleteDialog.documents.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
