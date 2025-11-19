import React, { useState } from "react";
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
} from "@mui/material";
import { ContentPaste as PasteIcon } from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";
import { useDocumentService } from "../services/documentService";
import { DocumentFile } from "../types/document.types";

interface PasteTextDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (document: DocumentFile) => void;
}

export const PasteTextDialog: React.FC<PasteTextDialogProps> = ({
  open,
  onClose,
  onUploadComplete,
}) => {
  const { t } = useTranslation();
  const documentService = useDocumentService();
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const filename = `pasted-text-${Date.now()}.txt`;
      const blob = new Blob([text], { type: "text/plain" });
      const file = new File([blob], filename, { type: "text/plain" });

      const response = await documentService.uploadFile(file, {});

      if (!response.success || !response.document) {
        throw new Error(response.error || t("files.uploadFailedFallback"));
      }

      onUploadComplete(response.document);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("files.uploadFailedFallback")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setText("");
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const characterCount = text.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PasteIcon />
          <Typography variant="h6">{t("files.pasteText")}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label={t("files.pasteText")}
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            rows={10}
            fullWidth
            disabled={isUploading}
            helperText={`${characterCount} characters`}
          />

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!text.trim() || isUploading}
        >
          {isUploading ? t("files.uploading") : t("files.upload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

