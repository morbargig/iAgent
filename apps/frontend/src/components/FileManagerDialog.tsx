import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Checkbox,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { fileService, FileInfo } from "../services/fileService";

interface FileManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onFileSelected?: (file: FileInfo) => void;
  title?: string;
  showAttachButton?: boolean;
}

export const FileManagerDialog: React.FC<FileManagerDialogProps> = ({
  open,
  onClose,
  onFileSelected,
  title = "File Manager",
  showAttachButton = true,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const filesData = await fileService.getFileList(50, 0);
      setFiles(filesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open]);

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
  };

  const handleAttach = () => {
    if (selectedFile && onFileSelected) {
      onFileSelected(selectedFile);
      onClose();
    }
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      await fileService.downloadFile(file.id, file.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleDelete = async (file: FileInfo) => {
    try {
      await fileService.deleteFile(file.id);
      await loadFiles();
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return "🖼️";
    if (mimetype.startsWith("video/")) return "🎥";
    if (mimetype.startsWith("audio/")) return "🎵";
    if (mimetype.includes("pdf")) return "📄";
    if (mimetype.includes("text")) return "📝";
    if (mimetype.includes("zip") || mimetype.includes("rar")) return "📦";
    return "📁";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh files">
              <IconButton
                onClick={loadFiles}
                disabled={loading}
                sx={{
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {showAttachButton && (
              <Button
                variant="contained"
                startIcon={<AttachFileIcon />}
                onClick={handleAttach}
                disabled={!selectedFile}
                sx={{
                  backgroundColor: "#10a37f",
                  "&:hover": {
                    backgroundColor: "#0d8a6b",
                  },
                  "&:disabled": {
                    backgroundColor: "action.disabled",
                  },
                }}
              >
                Attach File
              </Button>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              m: 2,
              borderRadius: "8px",
            }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        ) : files.length === 0 ? (
          <Box textAlign="center" py={6} px={4}>
            <AttachFileIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No files uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload files using the attachment button in the input area
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {showAttachButton && <TableCell padding="checkbox" />}
                    <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Upload Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow
                      key={file.id}
                      hover
                      selected={selectedFile?.id === file.id}
                      onClick={() => handleFileSelect(file)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "primary.50",
                        },
                      }}
                    >
                      {showAttachButton && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedFile?.id === file.id}
                            onChange={() => handleFileSelect(file)}
                            sx={{
                              color: "primary.main",
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {getFileIcon(file.mimetype)}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {file.filename}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {fileService.formatFileSize(file.size)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={file.mimetype}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: "0.75rem",
                            height: 24,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {fileService.formatDate(file.uploadDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Download file">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file);
                              }}
                              sx={{
                                color: "primary.main",
                                "&:hover": {
                                  backgroundColor: "primary.50",
                                },
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete file">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file);
                              }}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "error.50",
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: "text.secondary",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          {showAttachButton ? "Cancel" : "Close"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
