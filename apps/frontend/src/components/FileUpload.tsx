import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  IconButton,
  Chip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { fileService, FileUploadResult } from "../services/fileService";
import { useTranslation } from "../contexts/TranslationContext";

interface FileUploadProps {
  onUploadSuccess?: (result: FileUploadResult) => void;
  onUploadError?: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await fileService.uploadFile(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadSuccess?.(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("files.management.upload.uploadFailed");
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t("files.management.upload.title")}
      </Typography>

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          border: "2px dashed",
          borderColor: selectedFile ? "primary.main" : "grey.300",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          backgroundColor: selectedFile ? "primary.50" : "grey.50",
          transition: "all 0.3s ease",
          cursor: "pointer",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "primary.50",
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <UploadIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />

        <Typography variant="body1" color="text.secondary">
          {selectedFile
            ? selectedFile.name
            : t("files.management.upload.placeholder")}
        </Typography>

        {selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`${fileService.formatFileSize(selectedFile.size)} - ${selectedFile.type}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {selectedFile && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={<UploadIcon />}
          >
            {uploading
              ? t("files.management.upload.uploading")
              : t("files.management.upload.uploadFile")}
          </Button>

          <IconButton onClick={handleClear} disabled={uploading}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="text.secondary">
            {t("files.management.upload.progressText", {
              progress: uploadProgress,
            })}
          </Typography>
        </Box>
      )}

      {uploadResult && (
        <Alert
          severity="success"
          icon={<CheckIcon />}
          sx={{ mt: 2 }}
          action={
            <IconButton onClick={handleClear} size="small">
              <DeleteIcon />
            </IconButton>
          }
        >
          <Typography variant="body2">
            {t("files.management.upload.successMessage")}
          </Typography>
          <Typography variant="caption" display="block">
            {t("files.management.upload.fileInfo", {
              id: uploadResult.id,
              size: fileService.formatFileSize(uploadResult.size),
            })}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};
