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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link as LinkIcon } from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";
import { uploadFromUrl, validateUrl } from "../services/linkUploadService";
import { DocumentFile } from "../types/document.types";
import { useDocumentService } from "../services/documentService";

interface LinkUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (document: DocumentFile) => void;
}

export const LinkUploadDialog: React.FC<LinkUploadDialogProps> = ({
  open,
  onClose,
  onUploadComplete,
}) => {
  const { t } = useTranslation();
  const documentService = useDocumentService();
  const [url, setUrl] = useState("");
  const [linkType, setLinkType] = useState<"website" | "youtube">("website");
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setUrlValid(null);
    setError(null);

    if (value.trim()) {
      setIsValidating(true);
      try {
        const isValid = await validateUrl(value.trim(), linkType);
        setUrlValid(isValid);
        if (!isValid) {
          setError(t("files.invalidUrl"));
        }
      } catch (err) {
        setUrlValid(false);
        setError(err instanceof Error ? err.message : t("files.invalidUrl"));
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleLinkTypeChange = async (newType: "website" | "youtube") => {
    setLinkType(newType);
    if (url.trim()) {
      setIsValidating(true);
      try {
        const isValid = await validateUrl(url.trim(), newType);
        setUrlValid(isValid);
        if (!isValid) {
          setError(t("files.invalidUrl"));
        }
      } catch (err) {
        setUrlValid(false);
        setError(err instanceof Error ? err.message : t("files.invalidUrl"));
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!url.trim() || urlValid === false) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const document = await uploadFromUrl(url.trim(), linkType, documentService);
      onUploadComplete(document);
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
    setUrl("");
    setLinkType("website");
    setUrlValid(null);
    setError(null);
    setIsValidating(false);
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LinkIcon />
          <Typography variant="h6">{t("files.linkUpload")}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <RadioGroup
            value={linkType}
            onChange={(e) =>
              handleLinkTypeChange(e.target.value as "website" | "youtube")
            }
            row
          >
            <FormControlLabel
              value="website"
              control={<Radio />}
              label={t("files.website")}
            />
            <FormControlLabel
              value="youtube"
              control={<Radio />}
              label={t("files.youtube")}
            />
          </RadioGroup>

          <TextField
            label={t("files.linkUpload")}
            placeholder={
              linkType === "youtube"
                ? "https://www.youtube.com/watch?v=..."
                : "https://example.com"
            }
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            fullWidth
            disabled={isUploading}
            error={urlValid === false}
            helperText={
              isValidating
                ? t("common.loading")
                : urlValid === true
                ? t("files.validUrl")
                : urlValid === false
                ? t("files.invalidUrl")
                : ""
            }
            InputProps={{
              endAdornment: isValidating ? (
                <CircularProgress size={20} />
              ) : null,
            }}
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
          disabled={!url.trim() || urlValid === false || isUploading}
        >
          {isUploading ? t("files.uploading") : t("files.upload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

