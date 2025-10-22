import React from "react";
import {
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import {
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { DocumentFile } from "../../types/document.types";
import { useTranslation } from "../../contexts/TranslationContext";

interface DocumentDialogsProps {
  // Context Menu Props
  menuAnchor: { element: HTMLElement; document: DocumentFile } | null;
  onCloseMenu: () => void;
  onPreviewClick: (document: DocumentFile) => void;
  onDownloadClick: (document: DocumentFile) => void;
  onMenuDeleteClick: (document: DocumentFile) => void;

  // Delete Dialog Props
  deleteDialog: { open: boolean; document?: DocumentFile };
  onCloseDeleteDialog: () => void;
  onConfirmDelete: (document: DocumentFile) => void;

  // Bulk Delete Dialog Props
  bulkDeleteDialog: { open: boolean; documents: DocumentFile[] };
  onCloseBulkDeleteDialog: () => void;
  onConfirmBulkDelete: (documents: DocumentFile[]) => void;
}

export const DocumentDialogs: React.FC<DocumentDialogsProps> = ({
  menuAnchor,
  onCloseMenu,
  onPreviewClick,
  onDownloadClick,
  onMenuDeleteClick,
  deleteDialog,
  onCloseDeleteDialog,
  onConfirmDelete,
  bulkDeleteDialog,
  onCloseBulkDeleteDialog,
  onConfirmBulkDelete,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={onCloseMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor?.document) {
              onPreviewClick(menuAnchor.document);
            }
            onCloseMenu();
          }}
        >
          <PreviewIcon sx={{ mr: 1 }} />
          {t("preview")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor?.document) {
              onDownloadClick(menuAnchor.document);
            }
            onCloseMenu();
          }}
        >
          <DownloadIcon sx={{ mr: 1 }} />
          {t("download")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor?.document) {
              onMenuDeleteClick(menuAnchor.document);
            }
            onCloseMenu();
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          {t("common.delete")}
        </MenuItem>
      </Menu>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={onCloseDeleteDialog}>
        <DialogTitle>{t("files.deleteDocument")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("files.deleteDocumentConfirm", {
              name: deleteDialog.document?.name || t("files.thisDocument"),
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeleteDialog}>{t("common.cancel")}</Button>
          <Button
            onClick={() =>
              deleteDialog.document && onConfirmDelete(deleteDialog.document)
            }
            color="error"
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog.open} onClose={onCloseBulkDeleteDialog}>
        <DialogTitle>{t("files.deleteMultipleDocuments")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("files.deleteMultipleDocumentsConfirm", {
              count: bulkDeleteDialog.documents.length,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBulkDeleteDialog}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onConfirmBulkDelete(bulkDeleteDialog.documents)}
            color="error"
            variant="contained"
          >
            {t("files.deleteAll")} ({bulkDeleteDialog.documents.length})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
