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
  initialTab?: "upload" | "manage";
  selectionMode?: boolean;
  selectedDocuments?: DocumentFile[];
  maxSelection?: number;
  title?: string;
}

type TabValue = "upload" | "manage";

export const DocumentManagementDialog: React.FC<
  DocumentManagementDialogProps
> = ({
  open,
  onClose,
  onDocumentSelect,
  initialTab = "manage",
  selectionMode = false,
  selectedDocuments = [],
  maxSelection = 1,
  title,
}) => {
  const { t } = useTranslation();

  const [currentTab, setCurrentTab] = useState<TabValue>(initialTab);
  const [selectedDocs, setSelectedDocs] = useState<DocumentFile[]>([]);

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
        if (maxSelection && prev.length >= maxSelection) {
          return prev;
        }
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
    selectedDocs.forEach((doc) => onDocumentSelect?.(doc));
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
        <DialogActions>
          <Button onClick={handleClose}>{t("common.cancel")}</Button>
          <Button
            onClick={handleConfirmSelection}
            variant="contained"
            disabled={selectedDocs.length === 0}
          >
            {t("files.select")} ({selectedDocs.length})
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
