import React, { useState } from "react";
import { Box } from "@mui/material";
import { DocumentFile } from "../../types/document.types";
import { DocumentService } from "../../services/documentService";
import { DocumentToolbar } from "./DocumentToolbar";
import { DocumentList } from "./DocumentList";
import { DocumentDialogs } from "./DocumentDialogs";
import { TextFileEditorDialog } from "../TextFileEditorDialog";
import { useDocumentManager } from "./hooks/useDocumentManager";
import { useDocumentActions } from "./hooks/useDocumentActions";
import { useDocumentSelection } from "./hooks/useDocumentSelection";
import { useDocumentUI } from "./hooks/useDocumentUI";

interface DocumentManagerProps {
  onDocumentSelect?: (document: DocumentFile) => void;
  onDocumentPreview?: (document: DocumentFile) => void;
  onDocumentDelete?: (document: DocumentFile) => void;
  onToggleSelection?: (document: DocumentFile) => void;
  onSelectAll?: (documents: DocumentFile[]) => void;
  onClearSelection?: () => void;
  selectionMode?: boolean;
  selectedDocuments?: DocumentFile[];
  maxHeight?: number;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
  refetchTrigger?: number;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  onDocumentSelect,
  onDocumentPreview,
  onDocumentDelete,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  selectionMode = false,
  selectedDocuments = [],
  maxHeight = 600,
  showUploadButton = true,
  onUploadClick,
  refetchTrigger,
}) => {
  const [documentService] = useState(() => new DocumentService());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentFile | null>(null);

  // Custom hooks
  const {
    documents,
    loading,
    error,
    searchQuery,
    page,
    totalPages,
    totalDocuments,
    loadDocuments,
    handleSearch,
    setPage,
    setError,
  } = useDocumentManager();

  // Refetch when upload completes
  React.useEffect(() => {
    if (refetchTrigger !== undefined && refetchTrigger > 0) {
      loadDocuments(true);
    }
  }, [refetchTrigger, loadDocuments]);

  const { handleDownloadDocument, handleDeleteDocument, handleBulkDelete } =
    useDocumentActions({
      documentService,
      onDocumentDelete,
      onClearSelection,
      onReload: loadDocuments,
    });

  const { isDocumentSelected, handleDocumentClick } = useDocumentSelection({
    selectedDocuments,
    selectionMode,
    onDocumentSelect,
    onToggleSelection,
  });

  const {
    viewMode,
    setViewMode,
    deleteDialog,
    bulkDeleteDialog,
    menuAnchor,
    handleContextMenu,
    closeMenu,
    openDeleteDialog,
    closeDeleteDialog,
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
  } = useDocumentUI();

  // Event handlers
  const handleRefresh = () => {
    loadDocuments(true);
  };

  const handleErrorClose = () => {
    setError();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDeleteClick = (document: DocumentFile) => {
    openDeleteDialog(document);
  };

  const handleBulkDeleteClick = () => {
    openBulkDeleteDialog(selectedDocuments);
  };

  const handleConfirmDelete = async (document: DocumentFile) => {
    setIsDeleting(true);
    try {
      await handleDeleteDocument(document);
      closeDeleteDialog();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async (documents: DocumentFile[]) => {
    setIsDeleting(true);
    try {
      await handleBulkDelete(documents);
      closeBulkDeleteDialog();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMenuDeleteClick = (document: DocumentFile) => {
    openDeleteDialog(document);
  };

  const handleEditClick = (document: DocumentFile) => {
    setEditingDocument(document);
  };

  const handleEditSaveComplete = (updatedDocument: DocumentFile) => {
    loadDocuments(true);
    setEditingDocument(null);
  };

  const handleEditClose = () => {
    setEditingDocument(null);
  };

  const handleSelectAll = () => {
    if (onSelectAll && documents.length > 0) {
      onSelectAll(documents);
    }
  };

  const areAllVisibleSelected = () => {
    if (documents.length === 0) return false;
    return documents.every((doc) =>
      selectedDocuments.some((selected) => selected.id === doc.id)
    );
  };

  const areSomeVisibleSelected = () => {
    if (documents.length === 0) return false;
    return documents.some((doc) =>
      selectedDocuments.some((selected) => selected.id === doc.id)
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <DocumentToolbar
        totalDocuments={totalDocuments}
        showUploadButton={showUploadButton}
        onUploadClick={onUploadClick}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        error={error}
        onErrorClose={handleErrorClose}
        selectionMode={selectionMode}
        selectedDocumentsCount={selectedDocuments.length}
      />

      <DocumentList
        searchQuery={searchQuery}
        documents={documents}
        loading={loading || isDeleting}
        viewMode={viewMode}
        maxHeight={maxHeight}
        selectionMode={selectionMode}
        selectedDocuments={selectedDocuments}
        page={page}
        totalPages={totalPages}
        onDocumentClick={handleDocumentClick}
        onToggleSelection={onToggleSelection}
        onContextMenu={handleContextMenu}
        onDeleteClick={handleDeleteClick}
        onPageChange={handlePageChange}
        isDocumentSelected={isDocumentSelected}
        onSelectAll={handleSelectAll}
        areAllVisibleSelected={areAllVisibleSelected()}
        areSomeVisibleSelected={areSomeVisibleSelected()}
        onBulkDeleteClick={handleBulkDeleteClick}
        onEditClick={handleEditClick}
      />

      <DocumentDialogs
        menuAnchor={menuAnchor}
        onCloseMenu={closeMenu}
        onPreviewClick={
          onDocumentPreview ||
          (() => {
            return;
          })
        }
        onDownloadClick={handleDownloadDocument}
        onMenuDeleteClick={handleMenuDeleteClick}
        onEditClick={handleEditClick}
        deleteDialog={deleteDialog}
        onCloseDeleteDialog={closeDeleteDialog}
        onConfirmDelete={handleConfirmDelete}
        bulkDeleteDialog={bulkDeleteDialog}
        onCloseBulkDeleteDialog={closeBulkDeleteDialog}
        onConfirmBulkDelete={handleConfirmBulkDelete}
      />

      <TextFileEditorDialog
        open={editingDocument !== null}
        onClose={handleEditClose}
        document={editingDocument}
        onSaveComplete={handleEditSaveComplete}
      />
    </Box>
  );
};
