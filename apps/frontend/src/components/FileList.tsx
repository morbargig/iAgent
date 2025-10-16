import React, { useState, useEffect } from 'react';
import {
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
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Pagination,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilePresent as FileIcon,
} from '@mui/icons-material';
import { fileService, FileInfo } from '../services/fileService';

interface FileListProps {
  onFileDeleted?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ onFileDeleted }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filesPerPage = 10;

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const skip = (page - 1) * filesPerPage;
      const [filesData, count] = await Promise.all([
        fileService.getFileList(filesPerPage, skip),
        fileService.getFileCount(),
      ]);
      
      setFiles(filesData);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [page]);

  const handleDownload = async (file: FileInfo) => {
    try {
      await fileService.downloadFile(file.id, file.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setDeleting(true);
    try {
      await fileService.deleteFile(fileToDelete);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      await loadFiles();
      onFileDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    loadFiles();
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.startsWith('video/')) return '🎥';
    if (mimetype.startsWith('audio/')) return '🎵';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('text')) return '📝';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
    return '📁';
  };

  const totalPages = Math.ceil(totalCount / filesPerPage);

  if (loading && files.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Files in MongoDB GridFS ({totalCount} total)
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {files.length === 0 ? (
        <Box textAlign="center" py={4}>
          <FileIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first file using the upload component above
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {getFileIcon(file.mimetype)}
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {file.filename}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fileService.formatFileSize(file.size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={file.mimetype}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fileService.formatDate(file.uploadDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="File Info">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedFile(file)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(file.id)}
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

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* File Info Dialog */}
      <Dialog open={!!selectedFile} onClose={() => setSelectedFile(null)} maxWidth="sm" fullWidth>
        <DialogTitle>File Information</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Filename:</strong> {selectedFile.filename}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Size:</strong> {fileService.formatFileSize(selectedFile.size)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {selectedFile.mimetype}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Upload Date:</strong> {fileService.formatDate(selectedFile.uploadDate)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>File ID:</strong> {selectedFile.id}
              </Typography>
              {selectedFile.metadata && (
                <Box mt={2}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Metadata:</strong>
                  </Typography>
                  <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(selectedFile.metadata, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedFile(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this file? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
