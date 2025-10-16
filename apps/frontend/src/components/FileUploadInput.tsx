import React, { useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { fileService, FileUploadResult } from '../services/fileService';

interface FileUploadInputProps {
  onFileUploaded?: (result: FileUploadResult) => void;
  onFileRemoved?: () => void;
  disabled?: boolean;
  isDarkMode?: boolean;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  onFileUploaded,
  onFileRemoved,
  disabled = false,
  isDarkMode = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await fileService.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSelectedFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onFileUploaded?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    // no inline preview state to clear
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemoved?.();
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Upload button */}
      <Tooltip title="Upload file">
        <IconButton
          onClick={handleClick}
          disabled={disabled || uploading}
          sx={{
            width: "32px",
            height: "32px",
            backgroundColor: "transparent",
            color: isDarkMode ? "#8e8ea0" : "#6b7280",
            borderRadius: "16px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
              color: isDarkMode ? "#ffffff" : "#374151",
            },
            "&:disabled": {
              opacity: 0.5,
            },
          }}
        >
          <AttachFileIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      {/* No inline preview here – preview is rendered at top of input area */}

      {/* Error */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            py: 1, 
            px: 2,
            borderRadius: '8px',
            maxWidth: '300px',
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};
