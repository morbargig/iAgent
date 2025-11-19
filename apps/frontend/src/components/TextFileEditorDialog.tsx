import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";
import { useDocumentService } from "../services/documentService";
import { DocumentFile } from "../types/document.types";

interface TextFileEditorDialogProps {
  open: boolean;
  onClose: () => void;
  document: DocumentFile | null;
  onSaveComplete: (document: DocumentFile) => void;
}

export const TextFileEditorDialog: React.FC<TextFileEditorDialogProps> = ({
  open,
  onClose,
  document,
  onSaveComplete,
}) => {
  const { t } = useTranslation();
  const documentService = useDocumentService();
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFileContent = useCallback(async () => {
    if (!document) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = await documentService.getFileContent(document.id);
      setText(content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load file content"
      );
    } finally {
      setIsLoading(false);
    }
  }, [document, documentService]);

  useEffect(() => {
    if (open && document) {
      loadFileContent();
    } else {
      setText("");
      setError(null);
    }
  }, [open, document, loadFileContent]);

  const handleSave = async () => {
    if (!document) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedDocument = await documentService.updateTextFileContent(
        document.id,
        text
      );

      if (!updatedDocument.success || !updatedDocument.document) {
        throw new Error(
          updatedDocument.error || t("files.uploadFailedFallback")
        );
      }

      onSaveComplete(updatedDocument.document);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("files.uploadFailedFallback")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setText("");
    setError(null);
    setIsLoading(false);
    setIsSaving(false);
    onClose();
  };

  const characterCount = text.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EditIcon />
          <Typography variant="h6">
            {t("files.editText")} - {document?.name || ""}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <TextField
              label={t("files.editText")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              multiline
              rows={15}
              fullWidth
              disabled={isSaving}
              helperText={`${characterCount} characters`}
            />
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSaving || isLoading}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || isLoading || !text.trim()}
        >
          {isSaving ? t("common.loading") : t("files.saveChanges")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

