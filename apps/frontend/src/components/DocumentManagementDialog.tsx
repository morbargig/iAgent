// Document Management Dialog
// A comprehensive dialog for managing documents with upload, view, and organization features

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Slide,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentManager } from "./DocumentManager";
import { DocumentFile } from "../types/document.types";
import { useTranslation } from "../contexts/TranslationContext";
import { AttachedFile } from "../hooks/useFileHandling";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface DocumentManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onDocumentSelect?: (document: DocumentFile) => void;
  onDocumentRemove?: (document: DocumentFile) => void;
  initialTab?: "upload" | "manage";
  selectionMode?: boolean;
  selectedDocuments?: DocumentFile[];
  maxSelection?: number;
  title?: string;
  attachedFiles?: AttachedFile[];
}

type TabValue = "upload" | "manage";

export const DocumentManagementDialog: React.FC<
  DocumentManagementDialogProps
> = ({
  open,
  onClose,
  onDocumentSelect,
  onDocumentRemove,
  initialTab = "manage",
  selectionMode = false,
  selectedDocuments = [],
  maxSelection = 1,
  title,
  attachedFiles = [],
}) => {
  const { t } = useTranslation();

  // Convert AttachedFile to DocumentFile format
  const convertAttachedFileToDocumentFile = (
    attachedFile: AttachedFile
  ): DocumentFile => {
    return {
      id: attachedFile.id,
      name: attachedFile.filename,
      originalName: attachedFile.filename,
      size: attachedFile.size,
      type: attachedFile.mimetype.split("/")[0] || "unknown",
      mimeType: attachedFile.mimetype,
      uploadedAt: new Date(attachedFile.uploadDate),
      userId: "", // Will be populated by backend
      status: "ready" as const,
      url: "", // Will be populated if needed
      metadata: {},
    };
  };

  const [currentTab, setCurrentTab] = useState<TabValue>(initialTab);
  const [selectedDocs, setSelectedDocs] = useState<DocumentFile[]>([]);

  // Initialize selectedDocs with converted attachedFiles when dialog opens
  React.useEffect(() => {
    if (open && selectionMode && attachedFiles.length > 0) {
      const convertedFiles = attachedFiles.map(
        convertAttachedFileToDocumentFile
      );
      setSelectedDocs(convertedFiles);
    } else if (open && !selectionMode) {
      // Clear selection when not in selection mode
      setSelectedDocs([]);
    }
  }, [open, selectionMode, attachedFiles]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  // Handle upload completion
  const handleUploadComplete = (documents: DocumentFile[]) => {
    // Upload completed - do not automatically switch tabs
    // Let the user manually navigate to see uploaded documents
    console.log(`${documents.length} documents uploaded successfully`);
  };

  // Handle document selection (single click)
  const handleDocumentSelect = (document: DocumentFile) => {
    if (selectionMode) {
      handleToggleSelection(document);
    } else {
      onDocumentSelect?.(document);
      onClose();
    }
  };

  // Handle toggle selection (checkbox)
  const handleToggleSelection = (document: DocumentFile) => {
    setSelectedDocs((prev) => {
      const isSelected = prev.some((d) => d.id === document.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== document.id);
      } else {
        // Allow unlimited selection - remove the blocking logic
        return [...prev, document];
      }
    });
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    setSelectedDocs([]);
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (!selectionMode) return;

    // Compare current selection with original attached files
    const originalAttachedIds = attachedFiles.map((f) => f.id);
    const currentSelectedIds = selectedDocs.map((doc) => doc.id);

    // Find files that were removed (in original but not in current selection)
    const removedFiles = attachedFiles
      .filter((f) => !currentSelectedIds.includes(f.id))
      .map(convertAttachedFileToDocumentFile);

    // Find files that were added (in current selection but not in original)
    const addedFiles = selectedDocs.filter(
      (doc) => !originalAttachedIds.includes(doc.id)
    );

    // Handle removals
    removedFiles.forEach((doc) => onDocumentRemove?.(doc));

    // Handle additions
    addedFiles.forEach((doc) => onDocumentSelect?.(doc));

    setSelectedDocs([]);
    onClose();
  };

  // Handle document preview
  const handleDocumentPreview = (document: DocumentFile) => {
    // Simple approach: just show the content in an alert to avoid any tab issues
    const content =
      document.metadata?.extractedText || "No preview content available";
    const previewText = `📄 ${document.name}\n\nType: ${document.type}\nSize: ${(document.size / 1024).toFixed(1)} KB\n\nContent:\n${content}`;

    alert(previewText);
  };

  // Handle document deletion
  const handleDocumentDelete = (document: DocumentFile) => {
    // Refresh the document list after deletion
    // The actual deletion is handled by the DocumentManager component
    console.log(`Document deleted: ${document.name}`);
  };

  // Handle dialog close
  const handleClose = () => {
    setCurrentTab(initialTab);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="lg"
      fullWidth
      fullScreen
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <FolderIcon sx={{ marginInlineEnd: 1 }} />
            <Typography variant="h6">
              {title || t("files.documentManagement")}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="document management tabs"
            sx={{ px: 2 }}
          >
            <Tab
              icon={<UploadIcon sx={{ marginInlineEnd: 1 }} />}
              label={t("files.upload")}
              value="upload"
              iconPosition="start"
            />
            <Tab
              icon={<FolderIcon sx={{ marginInlineEnd: 1 }} />}
              label={t("files.manage")}
              value="manage"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          {currentTab === "upload" && (
            <DocumentUpload
              onUploadComplete={handleUploadComplete}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
          )}

          {currentTab === "manage" && (
            <DocumentManager
              onDocumentSelect={handleDocumentSelect}
              onDocumentPreview={handleDocumentPreview}
              onDocumentDelete={handleDocumentDelete}
              selectionMode={selectionMode}
              selectedDocuments={selectedDocs}
              onToggleSelection={handleToggleSelection}
              onClearSelection={handleClearSelection}
              showUploadButton={false}
            />
          )}
        </Box>
      </DialogContent>

      {selectionMode && (
        <DialogActions
          sx={{ flexDirection: "column", alignItems: "stretch", gap: 1 }}
        >
          {maxSelection && selectedDocs.length > maxSelection && (
            <Typography
              variant="caption"
              color="error"
              sx={{ textAlign: "center", px: 2 }}
            >
              {t("files.selectionLimitExceeded", {
                selected: selectedDocs.length,
                max: maxSelection,
              })}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={handleClose}>{t("common.cancel")}</Button>
            <Button
              onClick={handleConfirmSelection}
              variant="contained"
              disabled={
                selectedDocs.length === 0 ||
                (maxSelection ? selectedDocs.length > maxSelection : false)
              }
            >
              {t("files.select")} ({selectedDocs.length})
            </Button>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
};
