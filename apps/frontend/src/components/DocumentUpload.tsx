// Document Upload Component
// Drag & drop file upload interface with progress tracking

import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  useTheme,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Avatar,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import {
  DocumentFile,
  UploadProgress,
  formatFileSize,
  getFileIconComponent,
  getFileTypeName,
} from "../types/document.types";
import { useDocumentService } from "../services/documentService";
import { useTranslation } from "../contexts/TranslationContext";
import { format } from "date-fns";

interface DocumentUploadProps {
  onUploadComplete?: (documents: DocumentFile[]) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  disabled?: boolean;
  showProgress?: boolean;
  selectionMode?: boolean;
  selectedDocuments?: DocumentFile[];
  onToggleSelection?: (document: DocumentFile) => void;
  onSelectAll?: (documents: DocumentFile[]) => void;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error" | "cancelled";
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
  selectionMode = false,
  selectedDocuments = [],
  onToggleSelection,
  onSelectAll,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const documentService = useDocumentService();

  const [uploadingFiles, setUploadingFiles] = useState<
    Map<string, FileUploadState>
  >(new Map());
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedDocuments, setCompletedDocuments] = useState<DocumentFile[]>([]);

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejectionReasons = rejectedFiles.map((rejection) => {
          if (rejection.errors[0]?.code === "file-too-large") {
            return t("files.fileTooLarge", {
              fileName: rejection.file.name,
              maxSize: formatFileSize(maxFileSize),
            });
          }
          if (rejection.errors[0]?.code === "file-invalid-type") {
            return t("files.fileTypeNotSupported", {
              fileType: rejection.file.type,
            });
          }
          return t("files.fileRejected", {
            fileName: rejection.file.name,
          });
        });
        setError(rejectionReasons.join(", "));
      }

      // Check max files limit
      if (acceptedFiles.length + uploadingFiles.size > maxFiles) {
        setError(t("files.maxFilesExceeded", { maxFiles }));
        return;
      }

      // Upload accepted files in parallel
      acceptedFiles.forEach((file) => {
        uploadFile(file);
      });
    },
    [maxFiles, maxFileSize, uploadingFiles.size, t]
  );

  // Configure dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    maxFiles,
    maxSize: maxFileSize,
    accept: allowedTypes
      ? Object.fromEntries(allowedTypes.map((type) => [type, []]))
      : undefined,
    disabled,
  });

  // Upload single file
  const uploadFile = useCallback(
    async (file: File) => {
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize upload state
      const uploadState: FileUploadState = {
        file,
        progress: 0,
        status: "uploading",
      };

      setUploadingFiles((prev) => new Map(prev).set(fileId, uploadState));

      try {
        const response = await documentService.uploadFile(
          file,
          { maxFileSize, allowedTypes },
          (progress) => {
            setUploadingFiles((prev) => {
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
          setUploadingFiles((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(fileId);
            if (currentState) {
              newMap.set(fileId, {
                ...currentState,
                progress: 100,
                status: "completed",
                document: response.document,
              });
            }
            return newMap;
          });

          // Add to completed documents list (for tracking)
          const uploadedDocument = response.document;
          if (uploadedDocument) {
            setCompletedDocuments((prev) => {
              // Avoid duplicates
              if (!prev.some((d) => d.id === uploadedDocument.id)) {
                return [...prev, uploadedDocument];
              }
              return prev;
            });
          }

          // Keep the file in uploadingFiles with completed status
          // The row will update automatically to show completed state

          // Notify parent component
          onUploadComplete?.([response.document]);
        } else {
          throw new Error(response.error || t("files.uploadFailedFallback"));
        }
      } catch (error) {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(fileId);
          if (currentState) {
            newMap.set(fileId, {
              ...currentState,
              status: "error",
              error:
                error instanceof Error
                  ? error.message
                  : t("files.uploadFailedFallback"),
            });
          }
          return newMap;
        });
      }
    },
    [
      documentService,
      maxFileSize,
      allowedTypes,
      onUploadProgress,
      onUploadComplete,
      t,
    ]
  );

  // Cancel upload
  const cancelUpload = (fileId: string) => {
    documentService.cancelUpload(fileId);
    setUploadingFiles((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(fileId);
      if (currentState) {
        newMap.set(fileId, {
          ...currentState,
          status: "cancelled",
        });
      }
      return newMap;
    });
  };

  // Remove completed/error file from list
  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => {
      const newMap = new Map(prev);
      const uploadState = newMap.get(fileId);
      if (uploadState?.document) {
        const docId = uploadState.document.id;
        setCompletedDocuments((prevDocs) =>
          prevDocs.filter((doc) => doc.id !== docId)
        );
      }
      newMap.delete(fileId);
      return newMap;
    });
  };

  // Remove completed document from table
  const removeCompletedDocument = (documentId: string) => {
    setCompletedDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  // Check if document is selected
  const isDocumentSelected = (document: DocumentFile) => {
    return selectedDocuments.some((d) => d.id === document.id);
  };

  // Get all files (uploading + completed) for unified table
  // Uploading files stay in the same row and update when completed
  const getAllFiles = () => {
    const allFiles: Array<{
      id: string;
      file?: File;
      document?: DocumentFile;
      status: FileUploadState["status"];
      progress: number;
      error?: string;
      isUploading: boolean;
    }> = [];

    // Track which document IDs are already in uploading files
    const uploadedDocumentIds = new Set<string>();
    
    // Add uploading files (including those that completed but are still in uploadingFiles)
    uploadingFiles.forEach((uploadState, fileId) => {
      if (uploadState.document) {
        uploadedDocumentIds.add(uploadState.document.id);
      }
      allFiles.push({
        id: fileId,
        file: uploadState.file,
        document: uploadState.document,
        status: uploadState.status,
        progress: uploadState.progress,
        error: uploadState.error,
        isUploading: uploadState.status === "uploading",
      });
    });

    // Add completed documents that aren't already in uploading files
    completedDocuments.forEach((doc) => {
      if (!uploadedDocumentIds.has(doc.id)) {
        allFiles.push({
          id: doc.id,
          document: doc,
          status: "completed",
          progress: 100,
          isUploading: false,
        });
      }
    });

    return allFiles;
  };

  const allFiles = getAllFiles();

  // Check if all files are selected (only completed ones can be selected)
  const areAllFilesSelected = () => {
    const selectableFiles = allFiles.filter((f) => f.document && f.status === "completed");
    if (selectableFiles.length === 0) return false;
    return selectableFiles.every((f) => f.document && isDocumentSelected(f.document));
  };

  // Check if some files are selected
  const areSomeFilesSelected = () => {
    const selectableFiles = allFiles.filter((f) => f.document && f.status === "completed");
    if (selectableFiles.length === 0) return false;
    return selectableFiles.some((f) => f.document && isDocumentSelected(f.document));
  };

  // Handle select all files
  const handleSelectAllFiles = () => {
    const selectableFiles = allFiles
      .filter((f) => f.document && f.status === "completed")
      .map((f) => f.document)
      .filter((doc): doc is DocumentFile => doc !== undefined);
    if (onSelectAll && selectableFiles.length > 0) {
      onSelectAll(selectableFiles);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
          backgroundColor: isDragActive
            ? theme.palette.action.hover
            : "transparent",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon
          sx={{
            fontSize: 48,
            color: isDragActive
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            mb: 2,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? t("files.dropFilesHere") : t("files.dragDropFiles")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("files.supportedFormats")}: {t("files.supportedFormatsList")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("files.maxFileSize")}: {formatFileSize(maxFileSize)} •{" "}
          {t("files.maxFiles")}: {maxFiles}
        </Typography>
        <Button variant="outlined" sx={{ mt: 2 }} disabled={disabled}>
          {t("files.selectFiles")}
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

      {/* Unified Files Table */}
      {allFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("files.files")} ({allFiles.length})
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  {selectionMode && (
                    <TableCell
                      padding="checkbox"
                      sx={{
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Tooltip
                        title={
                          areAllFilesSelected()
                            ? t("files.deselectAll")
                            : t("files.selectAll")
                        }
                        arrow
                      >
                        <Checkbox
                          checked={areAllFilesSelected()}
                          indeterminate={
                            areSomeFilesSelected() && !areAllFilesSelected()
                          }
                          onChange={handleSelectAllFiles}
                          size="small"
                          inputProps={{
                            "aria-label": areAllFilesSelected()
                              ? t("files.deselectAll")
                              : t("files.selectAll"),
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      fontWeight: 600,
                    }}
                  >
                    {t("files.name")}
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      fontWeight: 600,
                    }}
                  >
                    {t("files.type")}
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      fontWeight: 600,
                    }}
                  >
                    {t("files.size")}
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      fontWeight: 600,
                    }}
                  >
                    {t("files.date")}
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      width: 48,
                    }}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {allFiles.map((fileItem) => {
                  const isCompleted = fileItem.status === "completed" && fileItem.document;
                  const isError = fileItem.status === "error";
                  const isUploading = fileItem.status === "uploading";
                  const isSelected = fileItem.document ? isDocumentSelected(fileItem.document) : false;
                  
                  const fileName = fileItem.document?.name || fileItem.file?.name || "";
                  const fileSize = fileItem.document?.size || fileItem.file?.size || 0;
                  const fileType = fileItem.document?.mimeType || fileItem.file?.type || "";
                  const uploadDate = fileItem.document?.uploadedAt || new Date();
                  
                  const { Icon, color } = fileItem.document
                    ? getFileIconComponent(fileItem.document.mimeType)
                    : { Icon: FileIcon, color: theme.palette.text.secondary };

                  return (
                    <TableRow
                      key={fileItem.id}
                      sx={{
                        cursor: isCompleted ? "pointer" : "default",
                        backgroundColor: isSelected
                          ? theme.palette.action.selected
                          : isError
                          ? theme.palette.error.light + "15"
                          : "transparent",
                        opacity: isError ? 0.7 : 1,
                        "&:hover": {
                          backgroundColor: isSelected
                            ? theme.palette.action.selected
                            : isError
                            ? theme.palette.error.light + "20"
                            : theme.palette.action.hover,
                        },
                      }}
                    >
                      {selectionMode && (
                        <TableCell padding="checkbox">
                          {isCompleted ? (
                            <Checkbox
                              checked={isSelected}
                              onChange={() => fileItem.document && onToggleSelection?.(fileItem.document)}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                            />
                          ) : (
                            <Checkbox disabled size="small" />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              backgroundColor: isError
                                ? theme.palette.error.light + "20"
                                : `${color}20`,
                            }}
                          >
                            {isUploading ? (
                              <FileIcon sx={{ color: color, fontSize: 18 }} />
                            ) : isError ? (
                              <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                            ) : (
                              <Icon sx={{ color: color, fontSize: 18 }} />
                            )}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {fileName}
                            </Typography>
                            {isUploading && (
                              <LinearProgress
                                variant="determinate"
                                value={fileItem.progress}
                                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                              />
                            )}
                            {isError && fileItem.error && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ mt: 0.5, display: "block" }}
                              >
                                {fileItem.error}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {isCompleted
                            ? getFileTypeName(fileType)
                            : isUploading
                            ? t("files.uploading", { defaultValue: "Uploading..." })
                            : isError
                            ? t("files.error", { defaultValue: "Error" })
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(fileSize)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {isCompleted
                            ? format(uploadDate, "MMM dd, yyyy")
                            : isUploading
                            ? t("files.uploading", { defaultValue: "Uploading..." })
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isUploading ? (
                          <Tooltip title={t("files.cancel", { defaultValue: "Cancel" })} arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelUpload(fileItem.id);
                              }}
                              color="default"
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title={t("files.remove")} arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (fileItem.document) {
                                  removeCompletedDocument(fileItem.document.id);
                                } else {
                                  removeFile(fileItem.id);
                                }
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};
