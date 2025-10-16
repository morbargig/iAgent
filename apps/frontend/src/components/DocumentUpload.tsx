// Document Upload Component
// Drag & drop file upload interface with progress tracking

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
  useTheme,
  Fade,
  Collapse,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { DocumentFile, UploadProgress, formatFileSize, getFileIcon } from '../types/document.types';
import { useDocumentService } from '../services/documentService';
import { useTranslation } from '../contexts/TranslationContext';

interface DocumentUploadProps {
  onUploadComplete?: (documents: DocumentFile[]) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  disabled?: boolean;
  showProgress?: boolean;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  document?: DocumentFile;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onUploadProgress,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes,
  disabled = false,
  showProgress = true,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const documentService = useDocumentService();
  
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, FileUploadState>>(new Map());
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadRefs = useRef<Map<string, AbortController>>(new Map());

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectionReasons = rejectedFiles.map(rejection => {
        if (rejection.errors[0]?.code === 'file-too-large') {
          return `File ${rejection.file.name} is too large (max ${formatFileSize(maxFileSize)})`;
        }
        if (rejection.errors[0]?.code === 'file-invalid-type') {
          return `File type ${rejection.file.type} is not supported`;
        }
        return `File ${rejection.file.name} was rejected`;
      });
      setError(rejectionReasons.join(', '));
    }

    // Check max files limit
    if (acceptedFiles.length + uploadingFiles.size > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Upload accepted files
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  }, [maxFiles, maxFileSize, uploadingFiles.size]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    maxFiles,
    maxSize: maxFileSize,
    accept: allowedTypes ? Object.fromEntries(allowedTypes.map(type => [type, []])) : undefined,
    disabled,
  });

  // Upload single file
  const uploadFile = async (file: File) => {
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize upload state
    const uploadState: FileUploadState = {
      file,
      progress: 0,
      status: 'uploading',
    };
    
    setUploadingFiles(prev => new Map(prev).set(fileId, uploadState));

    try {
      const response = await documentService.uploadFile(
        file,
        { maxFileSize, allowedTypes },
        (progress) => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const currentState = newMap.get(fileId);
            if (currentState) {
              newMap.set(fileId, {
                ...currentState,
                progress: progress.progress,
                status: progress.status as any,
              });
            }
            return newMap;
          });
          
          onUploadProgress?.(progress);
        }
      );

      if (response.success && response.document) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          const currentState = newMap.get(fileId);
          if (currentState) {
            newMap.set(fileId, {
              ...currentState,
              progress: 100,
              status: 'completed',
              document: response.document,
            });
          }
          return newMap;
        });

        // Notify parent component
        onUploadComplete?.([response.document]);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(fileId);
        if (currentState) {
          newMap.set(fileId, {
            ...currentState,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        }
        return newMap;
      });
    }
  };

  // Cancel upload
  const cancelUpload = (fileId: string) => {
    documentService.cancelUpload(fileId);
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(fileId);
      if (currentState) {
        newMap.set(fileId, {
          ...currentState,
          status: 'cancelled',
        });
      }
      return newMap;
    });
  };

  // Remove completed/error file from list
  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  // Get status icon
  const getStatusIcon = (status: FileUploadState['status']) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <CancelIcon color="disabled" />;
      default:
        return <FileIcon />;
    }
  };

  // Get status color
  const getStatusColor = (status: FileUploadState['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'primary';
    }
  };

  const uploadStates = Array.from(uploadingFiles.values());
  const hasActiveUploads = uploadStates.some(state => state.status === 'uploading');

  return (
    <Box sx={{ width: '100%' }}>
      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
          backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon
          sx={{
            fontSize: 48,
            color: isDragActive ? theme.palette.primary.main : theme.palette.text.secondary,
            mb: 2,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? t('dropFilesHere') : t('dragDropFiles')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('supportedFormats')}: PDF, Word, Excel, PowerPoint, Text, RTF, CSV
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('maxFileSize')}: {formatFileSize(maxFileSize)} • {t('maxFiles')}: {maxFiles}
        </Typography>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          disabled={disabled}
        >
          {t('selectFiles')}
        </Button>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Fade in={!!error}>
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Upload Progress */}
      {showProgress && uploadStates.length > 0 && (
        <Collapse in={uploadStates.length > 0}>
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('uploadingFiles')} ({uploadStates.length})
            </Typography>
            
            <List>
              {uploadStates.map((uploadState, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getStatusIcon(uploadState.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={uploadState.file.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(uploadState.file.size)} • {uploadState.file.type}
                        </Typography>
                        {uploadState.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={uploadState.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        {uploadState.status === 'error' && uploadState.error && (
                          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            {uploadState.error}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {uploadState.status === 'uploading' && (
                      <IconButton
                        onClick={() => cancelUpload(`upload_${index}`)}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    )}
                    {(uploadState.status === 'completed' || 
                      uploadState.status === 'error' || 
                      uploadState.status === 'cancelled') && (
                      <IconButton
                        onClick={() => removeFile(`upload_${index}`)}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Collapse>
      )}
    </Box>
  );
};
